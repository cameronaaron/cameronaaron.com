import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

/**
 * "Spot the SNP" — a single-nucleotide-polymorphism spotting mini-game.
 *
 * Each round renders a REFERENCE strand and a SAMPLE strand that is
 * identical except for exactly one base (the SNP). The player taps the
 * differing tile in the sample strand. All round generation, guess
 * checking, scoring, and visual-state derivation lives here so the
 * component only wires state to markup (modularization contract).
 *
 * Round generation is a pure function of a seed via the shared
 * createSeededRandom PRNG (reused from the hero particle engine) — never
 * Math.random() directly — so a fixed seed reproduces an identical round
 * on the server and the client's first paint (hydration-safety doctrine,
 * CLAUDE.md #10). Only rounds generated after a user click may seed off
 * fresh entropy (e.g. Date.now()), because that path never runs during
 * the initial render.
 */

export type Base = 'A' | 'T' | 'C' | 'G';

/** The four DNA bases, in a fixed display/lookup order. */
export const BASES: readonly Base[] = ['A', 'T', 'C', 'G'];

/** Strand length: long enough to feel like a real puzzle, short enough for mobile. */
export const STRAND_LENGTH = 12;

/** Fixed seed for the very first round — identical on server and client first paint. */
export const INITIAL_ROUND_SEED = 1337;

/** Points awarded per correct guess. Incorrect guesses never subtract. */
export const SCORE_INCREMENT = 1;

/** How long a correct guess lingers before auto-advancing to the next round. */
export const ROUND_ADVANCE_DELAY_MS = 900;

export interface DnaRound {
  reference: Base[];
  sample: Base[];
  /** Index (0-based) of the single base that differs between the two strands. */
  snpIndex: number;
}

export type RoundState = 'guessing' | 'correct' | 'incorrect';

export interface ScoreState {
  score: number;
  streak: number;
  bestStreak: number;
}

export const INITIAL_SCORE_STATE: ScoreState = { score: 0, streak: 0, bestStreak: 0 };

/** Solid-background Tailwind classes with AA contrast against white tile text. */
export const BASE_COLOR_CLASSES: Record<Base, string> = {
  A: 'bg-emerald-700',
  T: 'bg-cyan-700',
  C: 'bg-amber-700',
  G: 'bg-fuchsia-700',
};

/**
 * Generate one deterministic round from a seed. Same seed + length always
 * produces the same reference strand, sample strand, and SNP position.
 */
export function generateRound(seed: number, length: number = STRAND_LENGTH): DnaRound {
  const random = createSeededRandom(seed);

  // Mutation-testing note (2026-07): a Stryker mutant that replaces
  // `new Array(length)` with `new Array()` survives, but is a true
  // equivalent — the loop below assigns every index from 0..length-1
  // sequentially, and a plain array grows to fit each assignment exactly
  // the same way a pre-sized one does. Final length and contents are
  // identical either way, so no test can distinguish them.
  const reference: Base[] = new Array(length);
  for (let i = 0; i < length; i += 1) {
    reference[i] = BASES[Math.floor(random() * BASES.length)];
  }

  const snpIndex = Math.floor(random() * length);
  const originalIndex = BASES.indexOf(reference[snpIndex]);
  // Offset by 1-3 (mod 4) to guarantee a genuinely different base with zero
  // rejection-sampling loop — always exactly one draw from the PRNG.
  const offset = 1 + Math.floor(random() * (BASES.length - 1));
  const mutatedBase = BASES[(originalIndex + offset) % BASES.length];

  const sample = reference.slice();
  sample[snpIndex] = mutatedBase;

  return { reference, sample, snpIndex };
}

/**
 * The deterministic first round. Passed to useState by reference (not
 * wrapped in an inline `() => ...` arrow) so the component's lazy
 * initializer is unambiguously pure to both readers and to this repo's
 * ssr-hydration-contract static sweep — no fixed-size source-window
 * heuristic can mistake unrelated nearby code (e.g. a later Date.now()
 * call used only for post-click rounds) for something this initializer
 * reads.
 */
export function getInitialRound(): DnaRound {
  return generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH);
}

/** Does the guessed tile index match the actual SNP position? */
export function checkGuess(round: DnaRound, guessedIndex: number): boolean {
  return guessedIndex === round.snpIndex;
}

/**
 * Apply one guess outcome to the running score. Correct guesses increment
 * score and streak (and best streak); incorrect guesses only reset streak —
 * score is never decremented, per the "feedback, never punishment" design.
 */
export function computeScoreUpdate(current: ScoreState, correct: boolean): ScoreState {
  if (!correct) {
    return { score: current.score, streak: 0, bestStreak: current.bestStreak };
  }

  const streak = current.streak + 1;
  return {
    score: current.score + SCORE_INCREMENT,
    streak,
    bestStreak: Math.max(current.bestStreak, streak),
  };
}

/** Natural-language live-region message for a guess outcome (1-indexed for humans). */
export function getRoundResultMessage(correct: boolean, snpIndex: number, snpBase: Base): string {
  const position = snpIndex + 1;
  return correct
    ? `Correct — position ${position} was the SNP.`
    : `Not quite — the SNP was at position ${position}, base ${snpBase}.`;
}

/** Descriptive per-tile aria-label. `position` is 1-indexed for humans. */
export function getTileAriaLabel(position: number, base: Base): string {
  return `Position ${position}, base ${base}`;
}

export type TileVisualState = 'default' | 'guessed-correct' | 'guessed-incorrect' | 'reveal-snp';

/**
 * Per-tile visual state for the SAMPLE strand, derived from round phase.
 * While guessing every tile is 'default'. After a correct guess only the
 * (now-confirmed) SNP tile pulses green. After an incorrect guess the
 * clicked tile flashes red and the true SNP tile is revealed in green.
 */
export function getTileVisualState(
  index: number,
  round: DnaRound,
  roundState: RoundState,
  selectedIndex: number | null,
): TileVisualState {
  if (roundState === 'guessing') return 'default';

  if (roundState === 'correct') {
    return index === round.snpIndex ? 'guessed-correct' : 'default';
  }

  // roundState === 'incorrect'
  if (index === selectedIndex) return 'guessed-incorrect';
  if (index === round.snpIndex) return 'reveal-snp';
  return 'default';
}

const TILE_STATE_CLASSES: Record<TileVisualState, string> = {
  default: '',
  'guessed-correct': 'ring-4 ring-emerald-300 bg-emerald-500',
  'guessed-incorrect': 'ring-4 ring-red-300 bg-red-500',
  'reveal-snp': 'ring-4 ring-emerald-300 bg-emerald-500',
};

const ANIMATED_TILE_STATES = new Set<TileVisualState>(['guessed-correct', 'guessed-incorrect', 'reveal-snp']);

/**
 * Full className for a sample tile given its visual state, gated on
 * prefers-reduced-motion: the pulse animation is skipped entirely (a static
 * highlight remains) rather than shortened, per the reduced-motion contract.
 */
export function getTileClassName(state: TileVisualState, prefersReducedMotion: boolean): string {
  const stateClass = TILE_STATE_CLASSES[state];
  const animate = !prefersReducedMotion && ANIMATED_TILE_STATES.has(state) ? 'animate-pulse' : '';
  return [stateClass, animate].filter(Boolean).join(' ');
}

/** Tailwind background class for a base letter tile (reference row + idle sample tiles). */
export function getBaseColorClass(base: Base): string {
  return BASE_COLOR_CLASSES[base];
}
