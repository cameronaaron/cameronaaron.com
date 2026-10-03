/**
 * "Survive the Outage" — paired with Homestead, the Sun Brewed Homestead
 * operations core (cameronaaron/homestead, private).
 *
 * The game is a port of that repo's integration bus, not a cartoon of one.
 * Every farm write commits an event in the same transaction; the dispatcher
 * fans each event out to the sinks configured for its kind, claims due
 * deliveries under a lease, and settles each attempt as delivered,
 * retry-later or dead. The player logs farm events, breaks the sinks, and
 * watches what the real policy does about it.
 *
 * Source of each rule (all pinned in the test file):
 *   - retry policy, lease, batch      homestead.toml [dispatcher];
 *                                     RetryPolicy::next_delay in crates/bus
 *   - which sink gets which event     the `events` lists in homestead.toml,
 *                                     intersected with each Sink::accepts
 *   - claim / fail / retry semantics  crates/store/src/outbox.rs: a claim
 *                                     pushes next_attempt_at out by the
 *                                     lease; mark_failed adds an attempt and
 *                                     reschedules or dead-letters; retry_dead
 *                                     resets attempts to 0
 *   - Linear idempotency              issue_id_for in
 *                                     crates/integrations/src/linear.rs:
 *                                     SHA-256 of a namespaced key, shaped as
 *                                     a UUID v4, looked up before creating
 *
 * The Linear lesson is the reason the game exists. Delivery is
 * at-least-once, so a worker can crash after Linear accepted an issue but
 * before Homestead recorded it. With an id derived from the task, the retry
 * looks that id up, finds the issue and records it. With the random ids
 * Homestead used before, the retry has no way to find it and files a second.
 *
 * Only Homestead's three event-mirroring sinks are modelled. Its other Discord
 * sinks (deadline channels, role grants) accept event kinds no button here
 * logs, so they would never receive a delivery.
 */

export type SinkName = 'discord' | 'linear' | 'buffer';
export type EventKind = 'task.created' | 'harvest.logged' | 'inventory.low_stock';
export type SinkCondition = 'up' | 'outage' | 'bad-key';
export type IdScheme = 'derived' | 'random';
export type DeliveryStatus = 'pending' | 'delivered' | 'dead';
export type FarmActionId = 'harvest' | 'task' | 'tracked-task' | 'low-stock';

// ── homestead.toml [dispatcher] ─────────────────────────────────────────────
export const MAX_ATTEMPTS = 12;
export const BACKOFF_BASE_SECS = 5;
export const BACKOFF_CAP_SECS = 3600;
export const LEASE_SECS = 120;
export const BATCH = 50;

/** Most events the demo outbox holds before it asks for a reset. */
export const MAX_EVENTS = 6;
/** Upper bound on retry rounds one "wait until settled" press will run. */
export const MAX_SETTLE_ROUNDS = 400;

export interface SinkSpec {
  name: SinkName;
  label: string;
  /** The kinds homestead.toml routes to this sink. */
  events: ReadonlySet<string>;
}

export const SINKS: readonly SinkSpec[] = [
  {
    name: 'discord',
    label: 'Discord',
    events: new Set([
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
    ]),
  },
  { name: 'linear', label: 'Linear', events: new Set(['task.created', 'task.completed', 'inventory.low_stock']) },
  { name: 'buffer', label: 'Buffer', events: new Set(['harvest.logged', 'planting.created']) },
];

const SINK_LABELS: Record<SinkName, string> = { discord: 'Discord', linear: 'Linear', buffer: 'Buffer' };

export const SINK_CONDITIONS: readonly { condition: SinkCondition; label: string }[] = [
  { condition: 'up', label: 'Up' },
  { condition: 'outage', label: 'Outage' },
  { condition: 'bad-key', label: 'Bad key' },
];

export interface FarmAction {
  id: FarmActionId;
  label: string;
  kind: EventKind;
  /** The task's "Also track in Linear" box. */
  mirrorToLinear: boolean;
  summary: string;
}

export const FARM_ACTIONS: readonly FarmAction[] = [
  { id: 'harvest', label: 'Log a harvest', kind: 'harvest.logged', mirrorToLinear: false, summary: 'Harvest: 6 lb cherry tomatoes' },
  { id: 'task', label: 'Add a task', kind: 'task.created', mirrorToLinear: false, summary: 'Task: water the seedlings' },
  {
    id: 'tracked-task',
    label: 'Add a task tracked in Linear',
    kind: 'task.created',
    mirrorToLinear: true,
    summary: 'Task: fix the drip line',
  },
  { id: 'low-stock', label: 'Run low on drip tape', kind: 'inventory.low_stock', mirrorToLinear: false, summary: 'Low stock: drip tape' },
];

const FARM_ACTIONS_BY_ID: ReadonlyMap<FarmActionId, FarmAction> = new Map(FARM_ACTIONS.map((action) => [action.id, action]));

/** The drip-tape inventory item's id, fixed so its low-stock keys are stable. */
export const DRIP_TAPE_ITEM_ID = '5b3f8e2a-1c4d-4e6f-9a0b-7d2c1e3f4a5b';

// ── RetryPolicy::next_delay ─────────────────────────────────────────────────

/**
 * Seconds before the next attempt once `failedAttempts` (≥ 1) attempts have
 * failed: base · 2^(n−1), capped. `null` means give up and dead-letter.
 */
export function nextDelaySecs(failedAttempts: number): number | null {
  if (failedAttempts >= MAX_ATTEMPTS) return null;
  const exponent = Math.min(Math.max(failedAttempts - 1, 0), 30);
  return Math.min(BACKOFF_BASE_SECS * 2 ** exponent, BACKOFF_CAP_SECS);
}

/** Every delay the policy waits before giving up, in order. */
export function retrySchedule(): number[] {
  const delays: number[] = [];
  for (let failed = 1; ; failed += 1) {
    const delay = nextDelaySecs(failed);
    if (delay === null) return delays;
    delays.push(delay);
  }
}

// ── issue_id_for: SHA-256 → UUID v4 ─────────────────────────────────────────

const SHA256_INITIAL = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];
const SHA256_ROUND = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

/**
 * SHA-256 (FIPS 180-4). Synchronous, unlike SubtleCrypto, because an id is
 * derived inside a dispatcher tick and a tick is a pure state transition.
 */
export function sha256(message: Uint8Array): Uint8Array {
  const paddedLength = (((message.length + 9 + 63) >> 6) << 6);
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bitLength = message.length * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 2 ** 32));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const hash = Uint32Array.from(SHA256_INITIAL);
  const w = new Uint32Array(64);
  for (let block = 0; block < paddedLength; block += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(block + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + SHA256_ROUND[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  const digest = new Uint8Array(32);
  const out = new DataView(digest.buffer);
  for (let i = 0; i < 8; i += 1) out.setUint32(i * 4, hash[i]);
  return digest;
}

const UTF8 = new TextEncoder();

/** 16 bytes as a UUID v4 — uuid::Builder::from_random_bytes sets the version and variant bits. */
function uuidV4FromBytes(digest: Uint8Array): string {
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** issue_id_for: the Linear issue id Homestead uses for the thing named by `key`. */
export function issueIdFor(key: string): string {
  return uuidV4FromBytes(sha256(UTF8.encode(`sunbrewed-homestead/linear-issue/${key}`)));
}

/** task_issue_key */
export function taskIssueKey(taskId: string): string {
  return `task/${taskId}`;
}

/** low_stock_issue_key */
export function lowStockIssueKey(itemId: string, eventId: number): string {
  return `low-stock/${itemId}/${eventId}`;
}

/** A stand-in task id per event, stable so replays derive the same issue id. */
function demoTaskId(eventId: number): string {
  return uuidV4FromBytes(sha256(UTF8.encode(`demo-task/${eventId}`)));
}

/** The pre-scheme behaviour: a fresh id per attempt (deterministic here, so the demo replays). */
function randomIssueId(counter: number): string {
  return uuidV4FromBytes(sha256(UTF8.encode(`random-issue/${counter}`)));
}

// ── Routing: fan-out ────────────────────────────────────────────────────────

/** Sink::accepts, on top of the configured kinds (Routed in crates/bus). */
function sinkAccepts(sink: SinkName, kind: EventKind, mirrorToLinear: boolean): boolean {
  // LinearSink::accepts: a task only when its "Also track in Linear" box is ticked.
  if (sink === 'linear' && kind === 'task.created') return mirrorToLinear;
  return true;
}

/** The sinks one event fans out to, in configuration order. */
export function routeEvent(kind: EventKind, mirrorToLinear: boolean): SinkName[] {
  const sinks: SinkName[] = [];
  for (const spec of SINKS) {
    if (spec.events.has(kind) && sinkAccepts(spec.name, kind, mirrorToLinear)) sinks.push(spec.name);
  }
  return sinks;
}

// ── Game state ──────────────────────────────────────────────────────────────

export interface OutboxEvent {
  id: number;
  kind: EventKind;
  summary: string;
  /** The key Linear's issue id derives from, or null for events Linear never sees. */
  issueKey: string | null;
  /** tasks.linear_issue_id / low_stock_issues — what Homestead has written back. */
  recordedIssueId: string | null;
}

export interface Delivery {
  eventId: number;
  sink: SinkName;
  status: DeliveryStatus;
  attempts: number;
  /** Virtual seconds since the game began. */
  nextAt: number;
  lastError: string | null;
}

export interface LinearIssue {
  id: string;
  key: string;
  title: string;
}

export interface OutboxGame {
  /** Virtual clock, in seconds. */
  now: number;
  events: OutboxEvent[];
  deliveries: Delivery[];
  conditions: Record<SinkName, SinkCondition>;
  /** Crash the worker right after Linear accepts its next issue. */
  crashArmed: boolean;
  idScheme: IdScheme;
  issues: LinearIssue[];
  randomIdsIssued: number;
  note: string;
}

export function createGame(): OutboxGame {
  return {
    now: 0,
    events: [],
    deliveries: [],
    conditions: { discord: 'up', linear: 'up', buffer: 'up' },
    crashArmed: false,
    idScheme: 'derived',
    issues: [],
    randomIdsIssued: 0,
    note: 'Log something on the farm. Each write commits its event in the same transaction, then the dispatcher delivers it.',
  };
}

type Outcome = { kind: 'ok' } | { kind: 'retryable'; error: string } | { kind: 'permanent'; error: string } | { kind: 'crash' };

/**
 * Dispatcher::tick — claim every due delivery (oldest first, up to BATCH),
 * attempt it, settle it. One pass; events and issues are indexed once.
 */
export function runDispatcher(game: OutboxGame): OutboxGame {
  const due: number[] = [];
  for (let i = 0; i < game.deliveries.length; i += 1) {
    const delivery = game.deliveries[i];
    if (delivery.status === 'pending' && delivery.nextAt <= game.now) due.push(i);
  }
  if (due.length === 0) return game;
  due.sort((left, right) => game.deliveries[left].nextAt - game.deliveries[right].nextAt);
  due.length = Math.min(due.length, BATCH);

  const deliveries = game.deliveries.slice();
  const events = game.events.slice();
  const eventIndex = new Map<number, number>();
  for (let i = 0; i < events.length; i += 1) eventIndex.set(events[i].id, i);
  const issues = game.issues.slice();
  const issueIds = new Set<string>();
  for (const issue of issues) issueIds.add(issue.id);
  let { crashArmed, randomIdsIssued } = game;
  const notes: string[] = [];

  const attemptLinear = (eventPosition: number): Outcome => {
    const event = events[eventPosition];
    // mirror_task: already mirrored and recorded.
    if (event.recordedIssueId !== null || event.issueKey === null) return { kind: 'ok' };
    let id: string;
    if (game.idScheme === 'derived') {
      id = issueIdFor(event.issueKey);
    } else {
      randomIdsIssued += 1;
      id = randomIssueId(randomIdsIssued);
    }
    // ensure_issue: look the id up first; create only if Linear has never seen it.
    if (issueIds.has(id)) {
      notes.push(`Linear already had ${shortId(id)}, so the retry recorded it instead of filing another.`);
    } else {
      issues.push({ id, key: event.issueKey, title: event.summary });
      issueIds.add(id);
    }
    if (crashArmed) {
      crashArmed = false;
      notes.push('The worker crashed after Linear accepted the issue, before Homestead wrote the id back.');
      return { kind: 'crash' };
    }
    events[eventPosition] = { ...event, recordedIssueId: id };
    return { kind: 'ok' };
  };

  for (const position of due) {
    const claimed = deliveries[position];
    const condition = game.conditions[claimed.sink];
    const label = SINK_LABELS[claimed.sink];
    const eventPosition = eventIndex.get(claimed.eventId) ?? -1;
    let outcome: Outcome;
    if (condition === 'outage') outcome = { kind: 'retryable', error: `503 from ${label}: service unavailable` };
    else if (condition === 'bad-key') outcome = { kind: 'permanent', error: `401 from ${label}: API key rejected` };
    else if (claimed.sink === 'linear' && eventPosition >= 0) outcome = attemptLinear(eventPosition);
    else outcome = { kind: 'ok' };

    if (outcome.kind === 'ok') {
      deliveries[position] = { ...claimed, status: 'delivered', attempts: claimed.attempts + 1, lastError: null };
    } else if (outcome.kind === 'crash') {
      // Never settled: the claim's lease is all that brings it back.
      deliveries[position] = {
        ...claimed,
        nextAt: game.now + LEASE_SECS,
        lastError: `worker crashed mid-delivery; the ${LEASE_SECS} s lease lapses and it runs again`,
      };
    } else {
      const attempts = claimed.attempts + 1;
      const delay = outcome.kind === 'retryable' ? nextDelaySecs(attempts) : null;
      deliveries[position] =
        delay === null
          ? { ...claimed, status: 'dead', attempts, lastError: outcome.error }
          : { ...claimed, attempts, nextAt: game.now + delay, lastError: outcome.error };
    }
  }

  return {
    ...game,
    deliveries,
    events,
    issues,
    crashArmed,
    randomIdsIssued,
    note: notes.length > 0 ? notes.join(' ') : game.note,
  };
}

export function canLogEvent(game: OutboxGame): boolean {
  return game.events.length < MAX_EVENTS;
}

/** A farm write: the event and its deliveries commit together, then NOTIFY wakes the dispatcher. */
export function logFarmEvent(game: OutboxGame, actionId: FarmActionId): OutboxGame {
  const action = FARM_ACTIONS_BY_ID.get(actionId);
  if (!action || !canLogEvent(game)) return game;
  const id = game.events.length === 0 ? 1 : game.events[game.events.length - 1].id + 1;
  const sinks = routeEvent(action.kind, action.mirrorToLinear);
  let issueKey: string | null = null;
  if (sinks.includes('linear')) {
    issueKey = action.kind === 'task.created' ? taskIssueKey(demoTaskId(id)) : lowStockIssueKey(DRIP_TAPE_ITEM_ID, id);
  }
  const deliveries = game.deliveries.slice();
  for (const sink of sinks) deliveries.push({ eventId: id, sink, status: 'pending', attempts: 0, nextAt: game.now, lastError: null });
  const event: OutboxEvent = { id, kind: action.kind, summary: action.summary, issueKey, recordedIssueId: null };
  return runDispatcher({
    ...game,
    events: [...game.events, event],
    deliveries,
    note: `Event ${id} (${action.kind}) fanned out to ${sinks.map((sink) => SINK_LABELS[sink]).join(', ')}.`,
  });
}

/** The earliest pending attempt, or null when nothing is waiting. */
export function nextDueAt(game: OutboxGame): number | null {
  let earliest: number | null = null;
  for (const delivery of game.deliveries) {
    if (delivery.status === 'pending' && (earliest === null || delivery.nextAt < earliest)) earliest = delivery.nextAt;
  }
  return earliest;
}

/** Jump the clock to the next due attempt and run the dispatcher. */
export function waitForNextRetry(game: OutboxGame): OutboxGame {
  const due = nextDueAt(game);
  if (due === null) return { ...game, note: 'Nothing is waiting to retry.' };
  return runDispatcher({ ...game, now: Math.max(game.now, due) });
}

/** Keep waiting until every delivery is delivered or dead (bounded). */
export function waitUntilSettled(game: OutboxGame): OutboxGame {
  let current = game;
  for (let round = 0; round < MAX_SETTLE_ROUNDS && nextDueAt(current) !== null; round += 1) {
    current = waitForNextRetry(current);
  }
  return current;
}

export function setSinkCondition(game: OutboxGame, sink: SinkName, condition: SinkCondition): OutboxGame {
  if (game.conditions[sink] === condition) return game;
  return { ...game, conditions: { ...game.conditions, [sink]: condition } };
}

export function toggleCrash(game: OutboxGame): OutboxGame {
  return { ...game, crashArmed: !game.crashArmed };
}

export function setIdScheme(game: OutboxGame, idScheme: IdScheme): OutboxGame {
  if (game.idScheme === idScheme) return game;
  return { ...game, idScheme };
}

/** Integrations → Retry (retry_dead): back in the queue with a fresh attempt budget. */
export function retryDeadDelivery(game: OutboxGame, eventId: number, sink: SinkName): OutboxGame {
  let changed = false;
  const deliveries = game.deliveries.slice();
  for (let i = 0; i < deliveries.length; i += 1) {
    const delivery = deliveries[i];
    if (delivery.eventId === eventId && delivery.sink === sink && delivery.status === 'dead') {
      deliveries[i] = { ...delivery, status: 'pending', attempts: 0, nextAt: game.now };
      changed = true;
    }
  }
  if (!changed) return game;
  return runDispatcher({ ...game, deliveries, note: `Revived event ${eventId} for ${SINK_LABELS[sink]}.` });
}

// ── Presentation ────────────────────────────────────────────────────────────

/** Each event's deliveries, in one pass. */
export function groupDeliveriesByEvent(deliveries: readonly Delivery[]): Map<number, Delivery[]> {
  const grouped = new Map<number, Delivery[]>();
  for (const delivery of deliveries) {
    const list = grouped.get(delivery.eventId);
    if (list) list.push(delivery);
    else grouped.set(delivery.eventId, [delivery]);
  }
  return grouped;
}

export interface LinearSummary {
  issues: number;
  /** Issues beyond the first for any one key — what a retry should never file. */
  duplicates: number;
}

export function summarizeLinear(issues: readonly LinearIssue[]): LinearSummary {
  const keys = new Set<string>();
  let duplicates = 0;
  for (const issue of issues) {
    if (keys.has(issue.key)) duplicates += 1;
    else keys.add(issue.key);
  }
  return { issues: issues.length, duplicates };
}

export function formatDuration(totalSecs: number): string {
  const secs = Math.max(0, Math.round(totalSecs));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} m` : `${hours} h`;
  if (minutes > 0) return seconds > 0 ? `${minutes} m ${seconds} s` : `${minutes} m`;
  return `${seconds} s`;
}

export function getClockText(now: number): string {
  return `T+${formatDuration(now)}`;
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function getDeliveryText(delivery: Delivery, now: number): string {
  const plural = delivery.attempts === 1 ? 'attempt' : 'attempts';
  if (delivery.status === 'delivered') return delivery.attempts > 1 ? `Delivered on attempt ${delivery.attempts}` : 'Delivered';
  if (delivery.status === 'dead') return `Dead letter after ${delivery.attempts} ${plural}`;
  return `Attempt ${delivery.attempts + 1} in ${formatDuration(delivery.nextAt - now)}`;
}

const DELIVERY_CLASSES: Record<DeliveryStatus, string> = {
  delivered: 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100',
  pending: 'border-amber-300/40 bg-amber-500/10 text-amber-100',
  dead: 'border-rose-300/50 bg-rose-500/15 text-rose-100',
};

export function getDeliveryClassName(status: DeliveryStatus): string {
  return DELIVERY_CLASSES[status];
}

export function getToggleClassName(active: boolean): string {
  return active
    ? 'border-cyan-300 bg-cyan-400/15 text-white'
    : 'border-white/15 bg-white/5 text-muted-foreground hover:border-cyan-300/50';
}

export function getScheduleText(): string {
  const delays = retrySchedule();
  let total = 0;
  for (const delay of delays) total += delay;
  return (
    `Retries wait ${formatDuration(delays[0])}, ${formatDuration(delays[1])}, ${formatDuration(delays[2])}… doubling to a ` +
    `${formatDuration(BACKOFF_CAP_SECS)} cap: ${delays.length} retries over ${formatDuration(total)}, then the dead-letter queue.`
  );
}

export function getLinearVerdict(summary: LinearSummary, idScheme: IdScheme): string {
  if (summary.duplicates > 0) {
    return `${summary.duplicates} duplicate ${summary.duplicates === 1 ? 'issue' : 'issues'} in Linear. Random ids give a retry nothing to look up, so it filed again.`;
  }
  if (idScheme === 'derived') return 'No duplicates: every retry looks up the id derived from its task before creating anything.';
  return 'No duplicates yet. Crash a delivery and see what a random id does on the retry.';
}

export const OUTBOX_ARIA_LABEL =
  "Survive the Outage: log farm events, break Discord, Linear or Buffer, and watch Homestead's outbox retry, back off and dead-letter";
