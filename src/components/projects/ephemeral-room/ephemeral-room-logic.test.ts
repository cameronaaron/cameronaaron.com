import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHATTERS,
  INITIAL_ROOM_STATE,
  MAX_CHATTERS,
  MAX_FRAME_DELTA_MS,
  MEAN_POST_INTERVAL_MS,
  MIN_CHATTERS,
  REAL_MEAN_POST_INTERVAL_MS,
  REAL_ROOM_TIMEOUT_MS,
  ROOM_ARIA_LABEL,
  ROOM_TIMEOUT_MS,
  TIME_COMPRESSION,
  clampChatters,
  computeArrivalChance,
  computeSurvivalProbability,
  formatProbability,
  formatSeconds,
  getChatterVerdict,
  getLifeFraction,
  isRoomAnimationEnabled,
  postMessage,
  reviveRoom,
  stepRoom,
  type RoomState,
} from './ephemeral-room-logic';

describe('isRoomAnimationEnabled', () => {
  it('is enabled on full and balanced tiers', () => {
    expect(isRoomAnimationEnabled('full')).toBe(true);
    expect(isRoomAnimationEnabled('balanced')).toBe(true);
  });

  it('is disabled on lite and reduced tiers', () => {
    expect(isRoomAnimationEnabled('lite')).toBe(false);
    expect(isRoomAnimationEnabled('reduced')).toBe(false);
  });
});

function makeState(overrides: Partial<RoomState> = {}): RoomState {
  return { ...INITIAL_ROOM_STATE, ...overrides };
}

describe('time compression — the widget must be faster, not easier', () => {
  it('derives both compressed constants from the real ones', () => {
    expect(ROOM_TIMEOUT_MS).toBe(REAL_ROOM_TIMEOUT_MS / TIME_COMPRESSION);
    expect(MEAN_POST_INTERVAL_MS).toBe(REAL_MEAN_POST_INTERVAL_MS / TIME_COMPRESSION);
  });

  it('pins the real behaviour it is modelling: a ten-minute fade', () => {
    expect(REAL_ROOM_TIMEOUT_MS).toBe(600_000);
    expect(REAL_MEAN_POST_INTERVAL_MS).toBe(1_200_000);
  });

  it('leaves survival odds EXACTLY unchanged by the compression', () => {
    // The load-bearing claim in the module doc. Survival depends only on λT,
    // so scaling the timeout and the posting interval by the same factor must
    // cancel. If someone tunes one constant without the other, this fails.
    for (const chatters of [1, 2, 3, 4, 5]) {
      const realLambdaT = (chatters / REAL_MEAN_POST_INTERVAL_MS) * REAL_ROOM_TIMEOUT_MS;
      const realProbability = 1 - Math.exp(-realLambdaT);
      expect(computeSurvivalProbability(chatters)).toBeCloseTo(realProbability, 12);
    }
  });

  it('compresses ten real minutes into a watchable window', () => {
    expect(ROOM_TIMEOUT_MS).toBe(12_000);
    expect(MEAN_POST_INTERVAL_MS).toBe(24_000);
  });
});

describe('computeSurvivalProbability', () => {
  it('is exactly zero with nobody else in the room', () => {
    expect(computeSurvivalProbability(0)).toBe(0);
    expect(computeSurvivalProbability(-1)).toBe(0);
  });

  it('matches 1 - e^(-λT) exactly for one chatter', () => {
    // λT = 12000 / 24000 = 0.5
    expect(computeSurvivalProbability(1)).toBeCloseTo(1 - Math.exp(-0.5), 12);
  });

  it('leaves a single lurker below an even chance — the headline result', () => {
    expect(computeSurvivalProbability(1)).toBeLessThan(0.5);
    expect(computeSurvivalProbability(1)).toBeCloseTo(0.3935, 3);
  });

  it('rises monotonically with each extra person', () => {
    let previous = -1;
    for (let chatters = 0; chatters <= MAX_CHATTERS; chatters += 1) {
      const probability = computeSurvivalProbability(chatters);
      expect(probability).toBeGreaterThan(previous);
      previous = probability;
    }
  });

  it('crosses an even chance between one and two people', () => {
    expect(computeSurvivalProbability(1)).toBeLessThan(0.5);
    expect(computeSurvivalProbability(2)).toBeGreaterThan(0.5);
  });

  it('never reaches certainty — a room is never truly safe', () => {
    expect(computeSurvivalProbability(MAX_CHATTERS)).toBeLessThan(1);
  });
});

describe('computeArrivalChance', () => {
  it('is zero with no chatters or no elapsed time', () => {
    expect(computeArrivalChance(0, 100)).toBe(0);
    expect(computeArrivalChance(3, 0)).toBe(0);
    expect(computeArrivalChance(3, -5)).toBe(0);
  });

  it('matches the exponential form exactly', () => {
    expect(computeArrivalChance(2, 1000)).toBeCloseTo(1 - Math.exp(-(2 / MEAN_POST_INTERVAL_MS) * 1000), 12);
  });

  it('equals the full-window survival probability over a full window', () => {
    // Internal consistency: one timeout's worth of frames is one window.
    expect(computeArrivalChance(3, ROOM_TIMEOUT_MS)).toBeCloseTo(computeSurvivalProbability(3), 12);
  });

  it('grows with both the crowd and the elapsed time', () => {
    expect(computeArrivalChance(4, 500)).toBeGreaterThan(computeArrivalChance(2, 500));
    expect(computeArrivalChance(2, 1000)).toBeGreaterThan(computeArrivalChance(2, 500));
  });

  it('stays a probability for an absurdly long frame', () => {
    const chance = computeArrivalChance(MAX_CHATTERS, 10_000_000);
    expect(chance).toBeGreaterThan(0);
    expect(chance).toBeLessThanOrEqual(1);
  });

  it('never goes negative for a negative chatter count, even with real elapsed time', () => {
    // Regression pin: a mutant that drops the `chatters <= 0` guard entirely
    // (keeping only the dtMs check) lets negative chatters fall through to
    // the exponential formula, which produces a NEGATIVE "probability" —
    // `1 - exp(positive number)` is less than 0. The guard exists precisely
    // to keep this function's output a valid probability for any input.
    expect(computeArrivalChance(-5, 100)).toBe(0);
  });
});

describe('clampChatters', () => {
  it('rounds to a whole person', () => {
    expect(clampChatters(2.4)).toBe(2);
    expect(clampChatters(2.6)).toBe(3);
  });

  it('clamps below and above the supported range', () => {
    expect(clampChatters(-3)).toBe(MIN_CHATTERS);
    expect(clampChatters(99)).toBe(MAX_CHATTERS);
  });

  it('passes the bounds themselves through unchanged', () => {
    expect(clampChatters(MIN_CHATTERS)).toBe(MIN_CHATTERS);
    expect(clampChatters(MAX_CHATTERS)).toBe(MAX_CHATTERS);
  });

  it('pins the range and default', () => {
    expect(MIN_CHATTERS).toBe(0);
    expect(MAX_CHATTERS).toBe(5);
    expect(DEFAULT_CHATTERS).toBe(1);
  });
});

describe('getLifeFraction', () => {
  it('is full at zero silence and empty at the timeout', () => {
    expect(getLifeFraction(makeState({ silenceMs: 0 }))).toBe(1);
    expect(getLifeFraction(makeState({ silenceMs: ROOM_TIMEOUT_MS }))).toBe(0);
  });

  it('is exactly half at half the timeout', () => {
    expect(getLifeFraction(makeState({ silenceMs: ROOM_TIMEOUT_MS / 2 }))).toBeCloseTo(0.5, 12);
  });

  it('clamps rather than going negative past the timeout', () => {
    expect(getLifeFraction(makeState({ silenceMs: ROOM_TIMEOUT_MS * 3 }))).toBe(0);
  });

  it('clamps a negative silence to full life', () => {
    expect(getLifeFraction(makeState({ silenceMs: -100 }))).toBe(1);
  });
});

describe('postMessage', () => {
  it('resets silence and counts the message', () => {
    const state = makeState({ silenceMs: 9000, messages: 2 });
    postMessage(state, false);
    expect(state.silenceMs).toBe(0);
    expect(state.messages).toBe(3);
    expect(state.strangerMessages).toBe(0);
  });

  it('attributes a stranger message separately', () => {
    const state = makeState();
    postMessage(state, true);
    expect(state.messages).toBe(1);
    expect(state.strangerMessages).toBe(1);
  });

  it('revives a faded room', () => {
    const state = makeState({ status: 'faded', silenceMs: ROOM_TIMEOUT_MS });
    postMessage(state, false);
    expect(state.status).toBe('alive');
  });

  it('mutates in place and returns the same object', () => {
    const state = makeState();
    expect(postMessage(state, false)).toBe(state);
  });
});

describe('reviveRoom', () => {
  it('banks the run and clears the clock', () => {
    const state = makeState({ aliveMs: 8000, bestAliveMs: 3000, silenceMs: ROOM_TIMEOUT_MS, status: 'faded' });
    reviveRoom(state);
    expect(state.bestAliveMs).toBe(8000);
    expect(state.aliveMs).toBe(0);
    expect(state.silenceMs).toBe(0);
    expect(state.status).toBe('alive');
  });

  it('keeps a better previous record', () => {
    const state = makeState({ aliveMs: 1000, bestAliveMs: 9000 });
    reviveRoom(state);
    expect(state.bestAliveMs).toBe(9000);
  });
});

describe('stepRoom', () => {
  /** A draw of 1 can never be below any probability, so no stranger arrives. */
  const NO_ARRIVAL = 1;
  /** A draw of 0 is below any positive probability, so a stranger always arrives. */
  const ALWAYS_ARRIVAL = 0;

  it('accumulates silence and alive time when nobody posts', () => {
    const state = makeState();
    stepRoom(state, 100, 1, NO_ARRIVAL);
    expect(state.silenceMs).toBe(100);
    expect(state.aliveMs).toBe(100);
    expect(state.status).toBe('alive');
  });

  it('fades the room exactly at the timeout', () => {
    const state = makeState({ silenceMs: ROOM_TIMEOUT_MS - 50 });
    stepRoom(state, 50, 0, NO_ARRIVAL);
    expect(state.status).toBe('faded');
    expect(state.silenceMs).toBe(ROOM_TIMEOUT_MS);
  });

  it('does not fade one millisecond early', () => {
    const state = makeState({ silenceMs: ROOM_TIMEOUT_MS - 50 });
    stepRoom(state, 49, 0, NO_ARRIVAL);
    expect(state.status).toBe('alive');
  });

  it('banks the run length when it fades', () => {
    const state = makeState({ silenceMs: ROOM_TIMEOUT_MS - 10, aliveMs: 5000 });
    stepRoom(state, 10, 0, NO_ARRIVAL);
    expect(state.bestAliveMs).toBe(5010);
  });

  it('resets silence when a stranger posts', () => {
    const state = makeState({ silenceMs: 9000 });
    stepRoom(state, 100, 3, ALWAYS_ARRIVAL);
    expect(state.silenceMs).toBe(0);
    expect(state.strangerMessages).toBe(1);
    expect(state.aliveMs).toBe(9000 > 0 ? 100 : 100);
  });

  it('never lets a stranger arrive when the room is empty', () => {
    const state = makeState();
    stepRoom(state, 200, 0, ALWAYS_ARRIVAL);
    expect(state.strangerMessages).toBe(0);
    expect(state.silenceMs).toBe(200);
  });

  it('does nothing once the room has faded', () => {
    const state = makeState({ status: 'faded', silenceMs: ROOM_TIMEOUT_MS, aliveMs: 4000 });
    stepRoom(state, 500, 5, ALWAYS_ARRIVAL);
    expect(state.aliveMs).toBe(4000);
    expect(state.messages).toBe(0);
  });

  it('clamps an oversized frame delta', () => {
    const clamped = makeState();
    const capped = makeState();
    stepRoom(clamped, 5000, 0, NO_ARRIVAL);
    stepRoom(capped, MAX_FRAME_DELTA_MS, 0, NO_ARRIVAL);
    expect(clamped.silenceMs).toBe(capped.silenceMs);
    expect(MAX_FRAME_DELTA_MS).toBe(250);
  });

  it('ignores a zero or negative delta', () => {
    const state = makeState({ silenceMs: 300 });
    stepRoom(state, 0, 3, ALWAYS_ARRIVAL);
    stepRoom(state, -20, 3, ALWAYS_ARRIVAL);
    expect(state.silenceMs).toBe(300);
    expect(state.messages).toBe(0);
  });

  it('mutates in place and returns the same object — no per-frame allocation', () => {
    const state = makeState();
    expect(stepRoom(state, 16, 1, NO_ARRIVAL)).toBe(state);
  });

  it('keeps a busy room alive far longer than an empty one, over many frames', () => {
    // An end-to-end sanity check on the whole model rather than one branch.
    const busy = makeState();
    const empty = makeState();
    // Deterministic pseudo-draws: a fixed repeating sequence, same for both.
    for (let frame = 0; frame < 2000; frame += 1) {
      const draw = ((frame * 37) % 100) / 100;
      stepRoom(busy, 16, MAX_CHATTERS, draw);
      stepRoom(empty, 16, 0, draw);
    }
    expect(empty.status).toBe('faded');
    expect(busy.status).toBe('alive');
    expect(busy.strangerMessages).toBeGreaterThan(0);
  });
});

describe('formatting and verdicts', () => {
  it('formats seconds to one decimal', () => {
    expect(formatSeconds(12_000)).toBe('12.0');
    expect(formatSeconds(1460)).toBe('1.5');
    expect(formatSeconds(0)).toBe('0.0');
  });

  it('rounds a .x5 boundary the way IEEE-754 actually does, not the way it reads', () => {
    // 1450/1000 is not exactly 1.45 in binary — it is a hair below — so
    // toFixed(1) yields '1.4', not '1.5'. Pinned rather than papered over:
    // the display is a tenth of a second and nobody can see the difference,
    // but a future reader should not have to rediscover why.
    expect(formatSeconds(1450)).toBe('1.4');
  });

  it('formats a probability as a whole percent', () => {
    expect(formatProbability(0.3935)).toBe('39%');
    expect(formatProbability(1)).toBe('100%');
  });

  it('says plainly that an empty room lives only on the player', () => {
    expect(getChatterVerdict(0)).toContain('Nobody else is here');
  });

  it('calls out that one lurker usually is not enough', () => {
    const verdict = getChatterVerdict(1);
    expect(verdict).toContain('39%');
    expect(verdict).toContain('more often than not, the room dies waiting');
  });

  it('names the exact real-world posting cadence, not a mutated one', () => {
    // REAL_MEAN_POST_INTERVAL_MS / 60_000 = 20 minutes. A '/' -> '*' mutant
    // here produces a nonsense multi-million-minute figure instead — the
    // "39%"/"dies waiting" checks above don't touch this literal at all.
    expect(getChatterVerdict(1)).toContain('every 20 minutes');
  });

  it('describes the middle band as alive but not safe', () => {
    expect(getChatterVerdict(2)).toContain('never safe');
  });

  it('treats the 50% survival boundary as NOT yet safe (exclusive)', () => {
    // Regression pin for the exact boundary: at chatters = -2*ln(0.5) *
    // (MEAN_POST_INTERVAL_MS/ROOM_TIMEOUT_MS), computeSurvivalProbability
    // returns exactly 0.5 (verified by direct computation). The `< 0.5`
    // guard must treat that boundary as NOT below 0.5 — i.e. NOT the
    // "dies waiting" branch — a `<=` mutant would misclassify it.
    const chattersAtExactly50Percent = -Math.log(0.5) * (MEAN_POST_INTERVAL_MS / ROOM_TIMEOUT_MS);
    expect(computeSurvivalProbability(chattersAtExactly50Percent)).toBeCloseTo(0.5, 10);
    expect(getChatterVerdict(chattersAtExactly50Percent)).toContain('never safe');
  });

  it('treats the 85% survival boundary as ALREADY self-sustaining (exclusive)', () => {
    // At probability exactly 0.85, `probability < 0.85` is false, so real code
    // falls through to the THIRD branch ("sustains itself"). A `<=` mutant
    // would keep it in the "never safe" branch instead — the opposite verdict.
    const chattersAtExactly85Percent = -Math.log(0.15) * (MEAN_POST_INTERVAL_MS / ROOM_TIMEOUT_MS);
    expect(computeSurvivalProbability(chattersAtExactly85Percent)).toBeCloseTo(0.85, 10);
    expect(getChatterVerdict(chattersAtExactly85Percent)).toContain('sustains itself');
  });

  it('describes a self-sustaining room at the top of the range', () => {
    expect(getChatterVerdict(MAX_CHATTERS)).toContain('sustains itself');
  });

  it('gives every supported crowd size a real verdict', () => {
    for (let chatters = MIN_CHATTERS; chatters <= MAX_CHATTERS; chatters += 1) {
      expect(getChatterVerdict(chatters).length).toBeGreaterThan(40);
    }
  });

  it('pins the widget aria-label', () => {
    expect(ROOM_ARIA_LABEL).toBe(
      'Ephemeral chat room simulation. Send messages to reset the fade timer, and change how many other people are in the room to see how survival odds change.'
    );
  });
});
