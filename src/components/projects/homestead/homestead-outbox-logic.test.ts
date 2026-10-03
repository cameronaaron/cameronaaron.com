import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  BACKOFF_BASE_SECS,
  BACKOFF_CAP_SECS,
  BATCH,
  DRIP_TAPE_ITEM_ID,
  FARM_ACTIONS,
  LEASE_SECS,
  MAX_ATTEMPTS,
  MAX_EVENTS,
  SINKS,
  canLogEvent,
  createGame,
  formatDuration,
  getClockText,
  getDeliveryClassName,
  getDeliveryText,
  getLinearVerdict,
  getScheduleText,
  getToggleClassName,
  groupDeliveriesByEvent,
  issueIdFor,
  logFarmEvent,
  lowStockIssueKey,
  nextDelaySecs,
  nextDueAt,
  retryDeadDelivery,
  retrySchedule,
  routeEvent,
  runDispatcher,
  setIdScheme,
  setSinkCondition,
  sha256,
  shortId,
  summarizeLinear,
  taskIssueKey,
  toggleCrash,
  waitForNextRetry,
  waitUntilSettled,
  type Delivery,
  type OutboxGame,
} from './homestead-outbox-logic';

/**
 * An independent port of issue_id_for (crates/integrations/src/linear.rs),
 * built on Node's crypto rather than the module's own SHA-256:
 * Sha256::digest of the namespaced key, first 16 bytes, then
 * uuid::Builder::from_random_bytes (version 4, RFC 4122 variant).
 */
function referenceIssueId(key: string): string {
  const bytes = createHash('sha256').update(`sunbrewed-homestead/linear-issue/${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function delivery(game: OutboxGame, eventId: number, sink: string): Delivery {
  const found = game.deliveries.find((d) => d.eventId === eventId && d.sink === sink);
  if (!found) throw new Error(`fixture: no ${sink} delivery for event ${eventId}`);
  return found;
}

describe('pinned to homestead', () => {
  it('uses homestead.toml [dispatcher] exactly', () => {
    // max_attempts = 12, backoff_base_secs = 5, backoff_cap_secs = 3600,
    // lease_secs = 120, batch = 50 (homestead.toml, 2026-10-01).
    expect([MAX_ATTEMPTS, BACKOFF_BASE_SECS, BACKOFF_CAP_SECS, LEASE_SECS, BATCH]).toEqual([12, 5, 3600, 120, 50]);
  });

  it('routes the kinds homestead.toml lists for each sink', () => {
    expect(SINKS.map((sink) => [sink.name, [...sink.events]])).toEqual([
      [
        'discord',
        [
          'task.created',
          'task.completed',
          'planting.created',
          'harvest.logged',
          'inventory.low_stock',
          'release.signed',
          'release.declined',
          'member.onboarded',
          'animal.adopted',
          'task.deadlines',
          'digest.daily',
        ],
      ],
      ['linear', ['task.created', 'task.completed', 'inventory.low_stock']],
      ['buffer', ['harvest.logged', 'planting.created']],
    ]);
  });

  it('backs off like RetryPolicy::next_delay: doubling from 5 s, capped at an hour, 12 attempts', () => {
    expect(retrySchedule()).toEqual([5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 3600]);
    expect(nextDelaySecs(MAX_ATTEMPTS - 1)).toBe(3600);
    expect(nextDelaySecs(MAX_ATTEMPTS)).toBeNull();
    expect(nextDelaySecs(1_000_000)).toBeNull();
    expect(nextDelaySecs(0)).toBe(5);
  });

  it('spends about 2.4 hours retrying, as the bus docs and homestead.toml say', () => {
    const total = retrySchedule().reduce((sum, delay) => sum + delay, 0);
    expect(total).toBe(8715);
    expect(total / 3600).toBeCloseTo(2.4, 1);
  });

  it('derives Linear issue ids exactly as issue_id_for does', () => {
    for (const key of [
      taskIssueKey('0b5c7a8e-3f1d-4c2b-9e6a-1d2f3a4b5c6d'),
      lowStockIssueKey(DRIP_TAPE_ITEM_ID, 42),
      '',
      'ünïcode/🌱',
    ]) {
      expect(issueIdFor(key)).toBe(referenceIssueId(key));
    }
  });

  it('shapes every id as a UUID v4, the format Linear requires', () => {
    expect(issueIdFor('task/x')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(issueIdFor('task/x')).toBe(issueIdFor('task/x'));
    expect(issueIdFor('task/x')).not.toBe(issueIdFor('task/y'));
  });

  it('builds issue keys in the repo format', () => {
    expect(taskIssueKey('abc')).toBe('task/abc');
    expect(lowStockIssueKey('item', 7)).toBe('low-stock/item/7');
  });
});

describe('sha256', () => {
  it('matches node:crypto across every padding boundary', () => {
    for (const length of [0, 1, 55, 56, 63, 64, 65, 119, 120, 200]) {
      const input = new Uint8Array(length);
      for (let i = 0; i < length; i += 1) input[i] = (i * 31 + 7) & 0xff;
      expect(Buffer.from(sha256(input)).toString('hex')).toBe(createHash('sha256').update(input).digest('hex'));
    }
  });

  it('matches the FIPS 180-4 "abc" vector', () => {
    expect(Buffer.from(sha256(new TextEncoder().encode('abc'))).toString('hex')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });
});

describe('routing (fan-out)', () => {
  it('sends each farm action to the sinks that both list and accept it', () => {
    expect(routeEvent('harvest.logged', false)).toEqual(['discord', 'buffer']);
    expect(routeEvent('task.created', false)).toEqual(['discord']);
    expect(routeEvent('task.created', true)).toEqual(['discord', 'linear']);
    expect(routeEvent('inventory.low_stock', false)).toEqual(['discord', 'linear']);
  });

  it('offers one button per kind of write, with the Linear box only on the tracked task', () => {
    expect(FARM_ACTIONS.map((action) => [action.id, action.kind, action.mirrorToLinear])).toEqual([
      ['harvest', 'harvest.logged', false],
      ['task', 'task.created', false],
      ['tracked-task', 'task.created', true],
      ['low-stock', 'inventory.low_stock', false],
    ]);
  });
});

describe('the dispatcher', () => {
  it('delivers on the first attempt when every system is up', () => {
    const game = logFarmEvent(createGame(), 'harvest');
    expect(game.events).toHaveLength(1);
    expect(game.deliveries.map((d) => [d.sink, d.status, d.attempts])).toEqual([
      ['discord', 'delivered', 1],
      ['buffer', 'delivered', 1],
    ]);
    expect(game.note).toBe('Event 1 (harvest.logged) fanned out to Discord, Buffer.');
    expect(nextDueAt(game)).toBeNull();
  });

  it('only lets Linear see a task whose box is ticked', () => {
    expect(logFarmEvent(createGame(), 'task').deliveries.map((d) => d.sink)).toEqual(['discord']);
    const tracked = logFarmEvent(createGame(), 'tracked-task');
    expect(tracked.events[0].issueKey).toMatch(/^task\/[0-9a-f-]{36}$/);
    expect(logFarmEvent(createGame(), 'harvest').events[0].issueKey).toBeNull();
    expect(logFarmEvent(createGame(), 'low-stock').events[0].issueKey).toBe(lowStockIssueKey(DRIP_TAPE_ITEM_ID, 1));
  });

  it('numbers events in order', () => {
    const game = logFarmEvent(logFarmEvent(createGame(), 'task'), 'harvest');
    expect(game.events.map((event) => event.id)).toEqual([1, 2]);
  });

  it('isolates sinks: a Discord outage never touches Buffer', () => {
    const game = logFarmEvent(setSinkCondition(createGame(), 'discord', 'outage'), 'harvest');
    expect(delivery(game, 1, 'buffer').status).toBe('delivered');
    const discord = delivery(game, 1, 'discord');
    expect(discord).toMatchObject({ status: 'pending', attempts: 1, nextAt: 5, lastError: '503 from Discord: service unavailable' });
  });

  it('retries an outage on the policy schedule and dead-letters on attempt 12, 8715 s in', () => {
    const settled = waitUntilSettled(logFarmEvent(setSinkCondition(createGame(), 'discord', 'outage'), 'task'));
    expect(delivery(settled, 1, 'discord')).toMatchObject({ status: 'dead', attempts: 12 });
    expect(settled.now).toBe(8715);
  });

  it('walks the schedule one retry at a time', () => {
    let game = logFarmEvent(setSinkCondition(createGame(), 'discord', 'outage'), 'task');
    const times: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      game = waitForNextRetry(game);
      times.push(game.now);
    }
    expect(times).toEqual([5, 15, 35, 75]);
    expect(delivery(game, 1, 'discord').attempts).toBe(5);
  });

  it('delivers on the next retry once the system comes back', () => {
    let game = logFarmEvent(setSinkCondition(createGame(), 'linear', 'outage'), 'low-stock');
    game = waitForNextRetry(waitForNextRetry(game));
    game = waitForNextRetry(setSinkCondition(game, 'linear', 'up'));
    expect(delivery(game, 1, 'linear')).toMatchObject({ status: 'delivered', attempts: 4, lastError: null });
    expect(game.issues).toHaveLength(1);
  });

  it('dead-letters a permanent failure at once', () => {
    const game = logFarmEvent(setSinkCondition(createGame(), 'buffer', 'bad-key'), 'harvest');
    expect(delivery(game, 1, 'buffer')).toMatchObject({ status: 'dead', attempts: 1, lastError: '401 from Buffer: API key rejected' });
    expect(nextDueAt(game)).toBeNull();
  });

  it('Retry revives a dead letter with a fresh attempt budget', () => {
    let game = logFarmEvent(setSinkCondition(createGame(), 'buffer', 'bad-key'), 'harvest');
    game = retryDeadDelivery(setSinkCondition(game, 'buffer', 'up'), 1, 'buffer');
    expect(delivery(game, 1, 'buffer')).toMatchObject({ status: 'delivered', attempts: 1 });
    expect(game.note).toBe('Revived event 1 for Buffer.');
  });

  it('Retry ignores a delivery that is not dead', () => {
    const game = logFarmEvent(createGame(), 'harvest');
    expect(retryDeadDelivery(game, 1, 'buffer')).toBe(game);
    expect(retryDeadDelivery(game, 9, 'buffer')).toBe(game);
  });

  it('claims at most one batch per tick, oldest first', () => {
    const deliveries: Delivery[] = [];
    for (let i = 0; i < BATCH + 10; i += 1) {
      deliveries.push({ eventId: 100 + i, sink: 'discord', status: 'pending', attempts: 0, nextAt: BATCH + 10 - i, lastError: null });
    }
    const game = runDispatcher({ ...createGame(), now: 1000, deliveries });
    const delivered = game.deliveries.filter((d) => d.status === 'delivered');
    expect(delivered).toHaveLength(BATCH);
    // The ten with the latest nextAt wait for the next tick.
    for (const d of game.deliveries) expect(d.status === 'pending').toBe(d.nextAt > BATCH);
  });

  it('leaves deliveries that are not yet due alone', () => {
    const pending: Delivery = { eventId: 1, sink: 'discord', status: 'pending', attempts: 2, nextAt: 50, lastError: 'x' };
    const game = { ...createGame(), now: 49, deliveries: [pending] };
    expect(runDispatcher(game)).toBe(game);
  });

  it('reports the earliest of several pending attempts, whatever their order', () => {
    const base = createGame();
    const pending = (eventId: number, nextAt: number) =>
      ({ eventId, sink: 'discord', status: 'pending', attempts: 1, nextAt, lastError: null }) as const;
    expect(nextDueAt({ ...base, deliveries: [pending(1, 40), pending(2, 10), pending(3, 25)] })).toBe(10);
    expect(nextDueAt({ ...base, deliveries: [pending(1, 10), pending(2, 40)] })).toBe(10);
  });

  it('says so when nothing is waiting', () => {
    expect(waitForNextRetry(createGame()).note).toBe('Nothing is waiting to retry.');
    const settled = waitUntilSettled(createGame());
    expect(settled.now).toBe(0);
  });
});

describe('the Linear crash: why issue ids are derived', () => {
  it('a crash after Linear accepts leaves the delivery unsettled until the lease lapses', () => {
    const game = logFarmEvent(toggleCrash(createGame()), 'tracked-task');
    expect(game.crashArmed).toBe(false);
    expect(game.issues).toHaveLength(1);
    expect(delivery(game, 1, 'linear')).toMatchObject({ status: 'pending', attempts: 0, nextAt: LEASE_SECS });
    expect(game.events[0].recordedIssueId).toBeNull();
    expect(game.note).toContain('crashed after Linear accepted the issue');
  });

  it('with derived ids the retry finds the issue and records it: still one issue', () => {
    const game = waitForNextRetry(logFarmEvent(toggleCrash(createGame()), 'tracked-task'));
    expect(game.now).toBe(LEASE_SECS);
    expect(delivery(game, 1, 'linear')).toMatchObject({ status: 'delivered', attempts: 1 });
    expect(summarizeLinear(game.issues)).toEqual({ issues: 1, duplicates: 0 });
    expect(game.events[0].recordedIssueId).toBe(issueIdFor(game.events[0].issueKey!));
    expect(game.note).toContain('Linear already had');
  });

  it('with random ids the retry cannot find it and files a duplicate', () => {
    const start = toggleCrash(setIdScheme(createGame(), 'random'));
    const game = waitForNextRetry(logFarmEvent(start, 'tracked-task'));
    expect(summarizeLinear(game.issues)).toEqual({ issues: 2, duplicates: 1 });
    expect(game.issues[0].id).not.toBe(game.issues[1].id);
    expect(game.randomIdsIssued).toBe(2);
  });

  it('a Linear delivery that runs again after its id was recorded files nothing new', () => {
    // mirror_task's guard: a lease can lapse after the write-back, not only
    // before it. Random ids make the guard the only thing preventing a second
    // issue, since a fresh random id would never be found.
    const recorded = logFarmEvent(setIdScheme(createGame(), 'random'), 'tracked-task');
    expect(recorded.events[0].recordedIssueId).not.toBeNull();
    const rerun = {
      ...recorded,
      deliveries: recorded.deliveries.map((d) => (d.sink === 'linear' ? { ...d, status: 'pending' as const, nextAt: recorded.now } : d)),
    };
    const game = runDispatcher(rerun);
    expect(delivery(game, 1, 'linear').status).toBe('delivered');
    expect(summarizeLinear(game.issues)).toEqual({ issues: 1, duplicates: 0 });
    expect(game.randomIdsIssued).toBe(recorded.randomIdsIssued);
  });

  it('a low-stock crossing is just as safe under derived ids', () => {
    const game = waitForNextRetry(logFarmEvent(toggleCrash(createGame()), 'low-stock'));
    expect(summarizeLinear(game.issues)).toEqual({ issues: 1, duplicates: 0 });
  });

  it('without a crash, random ids are harmless too: the id is recorded on the first try', () => {
    const game = logFarmEvent(setIdScheme(createGame(), 'random'), 'tracked-task');
    expect(summarizeLinear(game.issues)).toEqual({ issues: 1, duplicates: 0 });
    expect(game.events[0].recordedIssueId).toBe(game.issues[0].id);
  });
});

describe('state helpers', () => {
  it('caps the demo outbox', () => {
    let game = createGame();
    for (let i = 0; i < MAX_EVENTS; i += 1) {
      expect(canLogEvent(game)).toBe(true);
      game = logFarmEvent(game, 'task');
    }
    expect(canLogEvent(game)).toBe(false);
    expect(logFarmEvent(game, 'task')).toBe(game);
  });

  it('ignores an unknown action', () => {
    const game = createGame();
    expect(logFarmEvent(game, 'nope' as never)).toBe(game);
  });

  it('returns the same state when a setter changes nothing', () => {
    const game = createGame();
    expect(setSinkCondition(game, 'discord', 'up')).toBe(game);
    expect(setIdScheme(game, 'derived')).toBe(game);
    expect(setSinkCondition(game, 'discord', 'outage').conditions).toEqual({ discord: 'outage', linear: 'up', buffer: 'up' });
    expect(toggleCrash(toggleCrash(game)).crashArmed).toBe(false);
  });

  it('starts empty with every system up', () => {
    expect(createGame()).toMatchObject({ now: 0, events: [], deliveries: [], crashArmed: false, idScheme: 'derived' });
  });
});

describe('presentation', () => {
  it('groups deliveries by event in one pass', () => {
    const game = logFarmEvent(logFarmEvent(createGame(), 'harvest'), 'task');
    const grouped = groupDeliveriesByEvent(game.deliveries);
    expect(grouped.get(1)?.map((d) => d.sink)).toEqual(['discord', 'buffer']);
    expect(grouped.get(2)?.map((d) => d.sink)).toEqual(['discord']);
  });

  it('formats durations the way the clock shows them', () => {
    expect([0, 5, 60, 75, 3600, 8715, -3].map(formatDuration)).toEqual(['0 s', '5 s', '1 m', '1 m 15 s', '1 h', '2 h 25 m', '0 s']);
    expect(getClockText(120)).toBe('T+2 m');
  });

  it('describes each delivery state', () => {
    const base: Delivery = { eventId: 1, sink: 'discord', status: 'pending', attempts: 3, nextAt: 100, lastError: null };
    expect(getDeliveryText(base, 60)).toBe('Attempt 4 in 40 s');
    expect(getDeliveryText({ ...base, status: 'delivered', attempts: 1 }, 0)).toBe('Delivered');
    expect(getDeliveryText({ ...base, status: 'delivered', attempts: 4 }, 0)).toBe('Delivered on attempt 4');
    expect(getDeliveryText({ ...base, status: 'dead', attempts: 1 }, 0)).toBe('Dead letter after 1 attempt');
    expect(getDeliveryText({ ...base, status: 'dead', attempts: 12 }, 0)).toBe('Dead letter after 12 attempts');
  });

  it('colours each status differently', () => {
    const classes = new Set(['delivered', 'pending', 'dead'].map((s) => getDeliveryClassName(s as Delivery['status'])));
    expect(classes.size).toBe(3);
    expect(getDeliveryClassName('dead')).toContain('rose');
    expect(getToggleClassName(true)).toContain('border-cyan-300 ');
    expect(getToggleClassName(false)).not.toContain('border-cyan-300 ');
  });

  it('states the real schedule', () => {
    expect(getScheduleText()).toBe(
      'Retries wait 5 s, 10 s, 20 s… doubling to a 1 h cap: 11 retries over 2 h 25 m, then the dead-letter queue.'
    );
  });

  it('counts only repeat keys as duplicates', () => {
    expect(summarizeLinear([])).toEqual({ issues: 0, duplicates: 0 });
    expect(
      summarizeLinear([
        { id: 'a', key: 'k1', title: '' },
        { id: 'b', key: 'k2', title: '' },
        { id: 'c', key: 'k1', title: '' },
        { id: 'd', key: 'k1', title: '' },
      ])
    ).toEqual({ issues: 4, duplicates: 2 });
  });

  it('names what went wrong, or why nothing did', () => {
    expect(getLinearVerdict({ issues: 2, duplicates: 1 }, 'random')).toBe(
      '1 duplicate issue in Linear. Random ids give a retry nothing to look up, so it filed again.'
    );
    expect(getLinearVerdict({ issues: 4, duplicates: 2 }, 'random')).toMatch(/^2 duplicate issues/);
    expect(getLinearVerdict({ issues: 1, duplicates: 0 }, 'derived')).toMatch(/^No duplicates: every retry/);
    expect(getLinearVerdict({ issues: 1, duplicates: 0 }, 'random')).toMatch(/^No duplicates yet/);
    expect(shortId('0123456789')).toBe('01234567');
  });
});
