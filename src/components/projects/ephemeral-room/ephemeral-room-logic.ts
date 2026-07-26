import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

/**
 * "Keep the Room Alive" — an ephemeral-chat decay simulation paired with the
 * thehellisthis.com project, whose main room fades after ten quiet minutes
 * unless people keep the conversation going.
 *
 * The mechanic is not invented for the widget; it IS the site's design. What
 * the widget adds is the question that design implies and a visitor would
 * never otherwise see answered: how many people does a room actually need to
 * sustain itself?
 *
 * Model each participant as posting at random with mean interval `M`, i.e. a
 * Poisson process of rate `λ = n / M` for `n` chatters. The room dies if no
 * message arrives within the timeout `T`. Inter-arrival times of a Poisson
 * process are exponential, so
 *
 *     P(at least one message within T) = 1 - e^(-λT)
 *
 * which is the survival probability per silence window. That is a real,
 * checkable property of the system rather than a vibe — one lurker leaves a
 * room dying more often than not, and the curve is steep enough that a
 * handful of people is the difference between a ghost town and a room that
 * persists indefinitely.
 *
 * Real-world durations are compressed by a single named factor so a visitor
 * doesn't wait ten minutes to see anything. Compressing BOTH the timeout and
 * the posting interval by the same factor leaves λT — and therefore every
 * survival probability — exactly unchanged, so the widget's odds are the
 * site's odds.
 *
 * All simulation math lives here (modularization contract). Randomness is
 * injected by the caller so every function is exact-value testable, and the
 * initial state is a plain constant with no time or random input, so the
 * server render and the client's first paint agree (CLAUDE.md #10).
 */

/** The live site's real behaviour: the main room fades after ten quiet minutes. */
export const REAL_ROOM_TIMEOUT_MS = 10 * 60 * 1000;

/** A plausible idle-participant cadence: one message every twenty minutes. */
export const REAL_MEAN_POST_INTERVAL_MS = 20 * 60 * 1000;

/**
 * Wall-clock compression. Applied to the timeout AND the posting interval
 * together, so the ratio λT that determines survival is identical to the real
 * system's — the widget is fast, not easier.
 */
export const TIME_COMPRESSION = 50;

export const ROOM_TIMEOUT_MS = REAL_ROOM_TIMEOUT_MS / TIME_COMPRESSION;
export const MEAN_POST_INTERVAL_MS = REAL_MEAN_POST_INTERVAL_MS / TIME_COMPRESSION;

export const MIN_CHATTERS = 0;
export const MAX_CHATTERS = 5;
export const DEFAULT_CHATTERS = 1;

/** Longest frame delta accepted, guarding against a backgrounded tab. */
export const MAX_FRAME_DELTA_MS = 250;

export type RoomStatus = 'alive' | 'faded';

export interface RoomState {
  /** Milliseconds of silence since the last message. */
  silenceMs: number;
  /** Total milliseconds the room has been alive this run. */
  aliveMs: number;
  /** Longest run banked so far, in milliseconds. */
  bestAliveMs: number;
  messages: number;
  /** Messages contributed by simulated strangers rather than the player. */
  strangerMessages: number;
  status: RoomStatus;
}

export const INITIAL_ROOM_STATE: RoomState = {
  silenceMs: 0,
  aliveMs: 0,
  bestAliveMs: 0,
  messages: 0,
  strangerMessages: 0,
  status: 'alive',
};

/** Remaining life as a 0-1 fraction of the timeout. */
export function getLifeFraction(state: RoomState): number {
  const remaining = 1 - state.silenceMs / ROOM_TIMEOUT_MS;
  // Stryker disable next-line EqualityOperator: at remaining exactly 0, the
  // guard is skipped and the function falls through to `return remaining`,
  // which is itself 0 — identical to what the early return produces. A
  // '<=' mutant returns early with the same value. No input distinguishes
  // the two. Hand-verified 2026-07-26 per ENGINEERING-STANDARDS §6 item 13.
  if (remaining < 0) return 0;
  // Stryker disable next-line EqualityOperator: same reasoning at remaining
  // exactly 1 — the fallthrough `return remaining` already yields 1.
  if (remaining > 1) return 1;
  return remaining;
}

/**
 * Probability that at least one message arrives within one full silence
 * window, for `chatters` participants: 1 - e^(-λT) with λ = chatters / M.
 */
export function computeSurvivalProbability(chatters: number): number {
  // Stryker disable next-line EqualityOperator: at chatters exactly 0, a '<'
  // mutant falls through instead of early-returning, but lambda then computes
  // to exactly 0 and 1 - exp(-0 * T) is exactly 0 too — the same value the
  // early return produces. Hand-verified 2026-07-26 per §6 item 13.
  if (chatters <= 0) return 0;
  const lambda = chatters / MEAN_POST_INTERVAL_MS;
  return 1 - Math.exp(-lambda * ROOM_TIMEOUT_MS);
}

/**
 * Probability that at least one stranger posts during a frame of `dtMs`.
 * Exact exponential form rather than the `λ·dt` small-angle shortcut — the
 * shortcut drifts once a frame runs long, and a clamped 250ms frame is long.
 */
export function computeArrivalChance(chatters: number, dtMs: number): number {
  // Stryker disable next-line EqualityOperator: at dtMs exactly 0 (chatters
  // positive), a '<' mutant on the dtMs side falls through instead of
  // early-returning, but -lambda*0 is 0 either way, so 1-exp(0) computes the
  // identical 0 the early return produces.
  // Stryker disable next-line EqualityOperator: same reasoning at chatters
  // exactly 0 (dtMs positive) — the chatters clause is untouched by this
  // specific mutant and still catches it, or lambda computes to exactly 0.
  // Both hand-verified 2026-07-26 per §6 item 13. The ConditionalExpression
  // mutant that drops the chatters clause ENTIRELY is NOT equivalent — see
  // the "negative chatters" test, which catches exactly that case.
  if (chatters <= 0 || dtMs <= 0) return 0;
  const lambda = chatters / MEAN_POST_INTERVAL_MS;
  return 1 - Math.exp(-lambda * dtMs);
}

/** Clamp the chatter count into its supported range, rounding to a whole person. */
export function clampChatters(value: number): number {
  const rounded = Math.round(value);
  // Stryker disable next-line EqualityOperator: at rounded exactly
  // MIN_CHATTERS, the fallthrough `return rounded` already equals
  // MIN_CHATTERS — a '<=' mutant's early return produces the same value.
  if (rounded < MIN_CHATTERS) return MIN_CHATTERS;
  // Stryker disable next-line EqualityOperator: same reasoning at exactly
  // MAX_CHATTERS. Both hand-verified 2026-07-26 per §6 item 13.
  if (rounded > MAX_CHATTERS) return MAX_CHATTERS;
  return rounded;
}

/** Record a message: silence resets to zero and the room revives if it had faded. */
export function postMessage(state: RoomState, fromStranger: boolean): RoomState {
  state.silenceMs = 0;
  state.messages += 1;
  if (fromStranger) state.strangerMessages += 1;
  state.status = 'alive';
  return state;
}

/** Reset the run, banking the best time. Used when the player restarts a faded room. */
export function reviveRoom(state: RoomState): RoomState {
  state.bestAliveMs = Math.max(state.bestAliveMs, state.aliveMs);
  state.silenceMs = 0;
  state.aliveMs = 0;
  state.status = 'alive';
  return state;
}

/**
 * Advance the simulation by `dtMs`. `randomDraw` is a [0, 1) value supplied by
 * the caller so arrivals stay deterministic under test. Mutates in place and
 * returns the same object — no per-frame allocation (§2.8).
 */
export function stepRoom(state: RoomState, dtMs: number, chatters: number, randomDraw: number): RoomState {
  if (state.status === 'faded') return state;

  // Stryker disable next-line EqualityOperator: at dtMs exactly
  // MAX_FRAME_DELTA_MS, both branches of the ternary already agree — the
  // clamp value equals dtMs itself, so a '>=' mutant selecting the clamp
  // branch produces the identical `step`.
  const step = dtMs > MAX_FRAME_DELTA_MS ? MAX_FRAME_DELTA_MS : dtMs;
  // Stryker disable next-line EqualityOperator: at step exactly 0, falling
  // through instead of early-returning still nets zero state change — a
  // zero-length frame contributes nothing to silence/alive time and
  // computeArrivalChance(chatters, 0) is itself 0, so no stranger can arrive
  // either way. Both hand-verified 2026-07-26 per §6 item 13.
  if (step <= 0) return state;

  // A stranger arriving resets silence before it can expire this frame.
  if (randomDraw < computeArrivalChance(chatters, step)) {
    state.aliveMs += step;
    return postMessage(state, true);
  }

  state.silenceMs += step;
  state.aliveMs += step;

  if (state.silenceMs >= ROOM_TIMEOUT_MS) {
    state.silenceMs = ROOM_TIMEOUT_MS;
    state.status = 'faded';
    state.bestAliveMs = Math.max(state.bestAliveMs, state.aliveMs);
  }

  return state;
}

export function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

export function formatProbability(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Human description of what a given chatter count means for room survival. */
export function getChatterVerdict(chatters: number): string {
  if (chatters === 0) {
    return 'Nobody else is here. The room is running purely on your messages — stop typing and it fades.';
  }

  const probability = computeSurvivalProbability(chatters);
  const odds = formatProbability(probability);

  if (probability < 0.5) {
    return `One lurker posting every ${Math.round(
      REAL_MEAN_POST_INTERVAL_MS / 60_000
    )} minutes clears the ten-minute window only ${odds} of the time — more often than not, the room dies waiting.`;
  }

  if (probability < 0.85) {
    return `${chatters} people give the room a ${odds} chance of surviving each quiet stretch. Usually alive, but never safe.`;
  }

  return `${chatters} people push survival to ${odds} per window. Past roughly this point the room sustains itself and the timeout stops mattering.`;
}

/**
 * The frame loop runs on tiers with headroom for continuous motion; lite and
 * reduced get a static explanation instead. Declared here rather than imported
 * from another game's logic module — a shared helper reached across sibling
 * features is coupling, and this is two comparisons.
 */
export function isRoomAnimationEnabled(tier: PerformanceTier): boolean {
  return tier === 'full' || tier === 'balanced';
}

export const ROOM_ARIA_LABEL =
  'Ephemeral chat room simulation. Send messages to reset the fade timer, and change how many other people are in the room to see how survival odds change.';
