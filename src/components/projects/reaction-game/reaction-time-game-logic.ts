/**
 * "Catch the Lapse" — a simple-visual-reaction-time psychophysics mini-game,
 * paired with the "Lapses in Sustained Attention Predicted by Changes in
 * Visually-Guided Movements" research project. That research linked motor
 * behavior to attention lapses; this game is a genuine, honest analog of the
 * classic reaction-time task the field uses to study exactly that link.
 *
 * Round flow: 'waiting' (idle target, random pre-go delay running) → 'go'
 * (target has changed appearance; the clock is running) → 'result' (reaction
 * time + category shown, or a false start flagged). All round-state
 * transitions, reaction-time computation, categorization thresholds, and
 * session-stat aggregation live here so the component only wires state to
 * markup (modularization contract).
 *
 * The pre-go delay is intentionally RANDOM within a bounded range rather
 * than a fixed interval — a learnable fixed delay lets a player anticipate
 * the "go" signal instead of genuinely reacting to it, which would defeat
 * the whole point. Anticipating (clicking before the target changes) is a
 * real psychophysics concept — an "anticipatory response" / false start —
 * and is exactly the kind of attention lapse the original research studied,
 * so it is flagged distinctly rather than treated as a punished mistake.
 *
 * Hydration safety (CLAUDE.md #10): none of this module's exports are called
 * from a useState lazy initializer, and the component's initial state
 * (phase='waiting', goTimestamp=null, lastResult=null, stats=
 * INITIAL_SESSION_STATS) is a plain constant with no random or time-based
 * input — identical on the server and the client's first paint. The actual
 * random delay draw and the reaction-time measurement both happen inside
 * useEffect/event handlers, which only ever run client-side after mount.
 */

/** Random pre-go delay lower bound, in milliseconds. */
export const MIN_DELAY_MS = 1500;

/** Random pre-go delay upper bound, in milliseconds. Wide range keeps the delay unlearnable. */
export const MAX_DELAY_MS = 4000;

/**
 * Mean simple visual reaction time for healthy young adults, measured with
 * dedicated lab hardware (photodiode/voice-key timing, not a browser) — a
 * consistent figure across decades of psychophysics literature, e.g. Woods,
 * Wyma, Yund, Herron & Reed (2015), "Factors influencing the latency of
 * simple reaction time," Frontiers in Human Neuroscience.
 */
export const LAB_MEAN_SIMPLE_REACTION_TIME_MS = 250;

/**
 * Real, physical latency a browser-based test still carries even after
 * timestamping stimulus onset from the actual paint frame (this game's own
 * fix, 2026-07, in the component: input-device polling, OS/browser event
 * dispatch, and display response time are all hops a JS-level fix cannot
 * remove. Online reaction-time research quantifies this residual overhead
 * against dedicated lab hardware — e.g. Anwyl-Irvine, Dalmaijer, Hodges &
 * Evershed (2021), "Realistic precision and accuracy of online experiment
 * platforms, web browsers, and devices," Behavior Research Methods. Without
 * this allowance, a bar set at the raw lab figure would fail to recognize
 * genuinely fast players simply because they're being measured through a
 * browser rather than dedicated lab equipment.
 */
export const BROWSER_MEASUREMENT_OVERHEAD_MS = 30;

/**
 * Vigilance/attention-lapse research commonly flags a response as
 * lapse-like once it runs to roughly 1.5-2x a person's typical reaction
 * time — the same phenomenon this game's paired research project studied.
 * 1.6x sits inside that commonly-cited range.
 */
export const ATTENTION_LAPSE_MULTIPLIER = 1.6;

/**
 * Reaction times strictly below this are "elite" — the lab-measured
 * population mean plus the browser-measurement allowance above, so the bar
 * reflects genuinely-fast human performance rather than an arbitrary number.
 */
export const REACTION_ELITE_THRESHOLD_MS = LAB_MEAN_SIMPLE_REACTION_TIME_MS + BROWSER_MEASUREMENT_OVERHEAD_MS;

/** Reaction times at or below this (and at/above the elite threshold) are "typical". Above it is "slow". */
export const REACTION_SLOW_THRESHOLD_MS = Math.round(
  LAB_MEAN_SIMPLE_REACTION_TIME_MS * ATTENTION_LAPSE_MULTIPLIER + BROWSER_MEASUREMENT_OVERHEAD_MS,
);

export type RoundPhase = 'waiting' | 'go' | 'result';

export type ReactionCategory = 'elite' | 'typical' | 'slow';

export type RoundResult =
  | { kind: 'reaction'; reactionTimeMs: number; category: ReactionCategory }
  | { kind: 'false-start' };

export interface SessionStats {
  /** Every completed round, reaction or false start. */
  roundsPlayed: number;
  /** Only genuine reaction rounds — the denominator for the average. */
  reactionCount: number;
  /** Sum of genuine reaction times only, in ms — false starts never contribute. */
  sumReactionMs: number;
  /** Fastest (lowest) genuine reaction time seen this session, or null if none yet. */
  bestMs: number | null;
  /** Most recent genuine reaction time, or null if none yet (persists through a later false start). */
  lastReactionMs: number | null;
}

export const INITIAL_SESSION_STATS: SessionStats = {
  roundsPlayed: 0,
  reactionCount: 0,
  sumReactionMs: 0,
  bestMs: null,
  lastReactionMs: null,
};

/**
 * Map a [0, 1) random draw onto the [MIN_DELAY_MS, MAX_DELAY_MS) pre-go
 * delay range. Pure and injectable so it is exact-value testable — the
 * component supplies Math.random() as the input at call time, always from
 * inside useEffect, never a useState lazy initializer.
 */
export function computeRandomDelayMs(randomValue: number): number {
  return MIN_DELAY_MS + randomValue * (MAX_DELAY_MS - MIN_DELAY_MS);
}

/** Elapsed time between the "go" signal and the click, in milliseconds. */
export function computeReactionTimeMs(goTimestamp: number, clickTimestamp: number): number {
  return clickTimestamp - goTimestamp;
}

/** Categorize a genuine reaction time against the named thresholds above. */
export function categorizeReactionTime(reactionTimeMs: number): ReactionCategory {
  if (reactionTimeMs < REACTION_ELITE_THRESHOLD_MS) return 'elite';
  if (reactionTimeMs <= REACTION_SLOW_THRESHOLD_MS) return 'typical';
  return 'slow';
}

/**
 * Resolve a click into a round result. A click that lands while the target
 * is still 'waiting' (or with no recorded go-timestamp) is a false start —
 * clicked before the "go" signal, i.e. an anticipatory response rather than
 * a genuine reaction. A click during 'go' is a genuine, timed reaction.
 */
export function resolveClick(phase: RoundPhase, goTimestamp: number | null, clickTimestamp: number): RoundResult {
  if (phase !== 'go' || goTimestamp === null) {
    return { kind: 'false-start' };
  }

  const reactionTimeMs = computeReactionTimeMs(goTimestamp, clickTimestamp);
  return { kind: 'reaction', reactionTimeMs, category: categorizeReactionTime(reactionTimeMs) };
}

/**
 * Fold one round result into the running session stats. False starts only
 * increment roundsPlayed — they never touch the reaction-time aggregates,
 * per the "feedback, never punishment" design and so a burst of anticipatory
 * clicks can't drag down or inflate the genuine reaction-time average.
 */
export function computeStatsUpdate(current: SessionStats, result: RoundResult): SessionStats {
  const roundsPlayed = current.roundsPlayed + 1;

  if (result.kind === 'false-start') {
    return { ...current, roundsPlayed };
  }

  const reactionCount = current.reactionCount + 1;
  const sumReactionMs = current.sumReactionMs + result.reactionTimeMs;
  const bestMs = current.bestMs === null ? result.reactionTimeMs : Math.min(current.bestMs, result.reactionTimeMs);

  return {
    roundsPlayed,
    reactionCount,
    sumReactionMs,
    bestMs,
    lastReactionMs: result.reactionTimeMs,
  };
}

/** Average genuine reaction time in ms, or null if no genuine reaction has been recorded yet. */
export function getAverageReactionMs(stats: SessionStats): number | null {
  return stats.reactionCount > 0 ? stats.sumReactionMs / stats.reactionCount : null;
}

/**
 * True only when this reaction beats a PRIOR best — a first-ever round has
 * nothing to compare against, so it's just a result, not a "new best" worth
 * celebrating. Takes the pre-update best explicitly (the caller reads
 * `stats.bestMs` before folding this round into stats) so this stays pure
 * and doesn't need to know about update ordering.
 *
 * Mutation-testing note (2026-07, hand-verified per ENGINEERING-STANDARDS.md
 * §6 item 13): a Stryker mutant that replaces `previousBestMs !== null` with
 * `true` survives, but is a true equivalent, not a real gap. When
 * previousBestMs is null, the mutant falls through to
 * `reactionTimeMs < previousBestMs`, i.e. `reactionTimeMs < null`, which JS
 * coerces to `reactionTimeMs < 0`. reactionTimeMs is a click-minus-go
 * duration and can never be negative, so that comparison is always false —
 * identical to the original short-circuit. No valid input can distinguish
 * the two, so no test is written for it.
 */
export function isNewBestReaction(previousBestMs: number | null, reactionTimeMs: number): boolean {
  return previousBestMs !== null && reactionTimeMs < previousBestMs;
}

/** Round to the nearest millisecond and format for display, e.g. "312ms". */
export function formatMs(ms: number): string {
  return `${Math.round(ms)}ms`;
}

const REACTION_CATEGORY_LABELS: Record<ReactionCategory, string> = {
  elite: 'Elite reflexes',
  typical: 'Typical human reaction time',
  slow: 'Slower than typical — attention may have lapsed',
};

/** Human-readable label for a reaction-time category. */
export function getReactionCategoryLabel(category: ReactionCategory): string {
  return REACTION_CATEGORY_LABELS[category];
}

/**
 * Exact live-region message for a round's result. False starts get an
 * honest, non-punitive explanation tying the moment back to the research
 * theme; genuine reactions get the timed value and its category, plus a
 * distinct "new personal best" callout for whoever actually earns one — the
 * concrete reward for a genuinely fast reaction, not just a category label.
 */
export function getResultMessage(result: RoundResult, isNewBest: boolean): string {
  if (result.kind === 'false-start') {
    return "False start — you clicked before the target changed. That's an anticipatory response, the same kind of attention lapse the original research measured.";
  }

  const base = `${formatMs(result.reactionTimeMs)} — ${getReactionCategoryLabel(result.category)}.`;
  return isNewBest ? `${base} New personal best!` : base;
}

const TARGET_ARIA_LABELS: Record<RoundPhase, string> = {
  waiting: "Waiting... don't click yet",
  go: 'Go! Click now',
  result: 'Round finished — press Try again to start a new round',
};

/** Descriptive aria-label for the target button, keyed on round phase. */
export function getTargetAriaLabel(phase: RoundPhase): string {
  return TARGET_ARIA_LABELS[phase];
}

const TARGET_PHASE_CLASSES: Record<RoundPhase, string> = {
  waiting: 'bg-slate-700 border-slate-500',
  go: 'bg-emerald-500 border-emerald-300',
  result: 'bg-slate-800 border-slate-600',
};

/**
 * Full className for the target button given its phase, gated on
 * prefers-reduced-motion: the "go" trigger gets a brief pulse to draw the
 * eye when motion is allowed; under reduced motion it's an instant color
 * swap only, per this repo's established reduced-motion convention.
 */
export function getTargetClassName(phase: RoundPhase, prefersReducedMotion: boolean): string {
  const stateClass = TARGET_PHASE_CLASSES[phase];
  const animate = !prefersReducedMotion && phase === 'go' ? 'animate-pulse' : '';
  return [stateClass, animate].filter(Boolean).join(' ');
}
