import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

/**
 * "Fatal Feline Attraction" — a Y-maze odor-choice task paired with the
 * "Toxoplasma Gondii Modifies Personality" essay.
 *
 * The player is shown a rodent (infected with T. gondii or not) at the base of
 * a two-armed maze, each arm carrying an odor, and predicts which arm it
 * enters. The whole point is one specific, genuinely counter-intuitive finding
 * rather than a vague "parasites change behaviour" gesture:
 *
 *   Uninfected rodents innately avoid CAT odor. Rodents infected with
 *   Toxoplasma gondii lose that aversion — and in Berdoy, Webster &
 *   Macdonald's rats it inverted into a mild ATTRACTION (2000, Proc. R. Soc.
 *   B 267:1591, "Fatal attraction in rats infected with Toxoplasma gondii").
 *
 * The load-bearing detail, and the reason this makes a real game instead of a
 * one-fact card: the manipulation is SPECIFIC, not general sickness or
 * blanket anxiolysis. Infected rats keep normal aversion to other predator
 * odors (e.g. mink/fox) and show normal general activity, learning, and
 * neophobia. A player who over-generalises to "infection = fearless" gets the
 * fox arms wrong, which is exactly the misconception worth correcting.
 *
 * Why the parasite would do this: the cat is T. gondii's DEFINITIVE host — the
 * only species it can complete sexual reproduction in — so a rodent that walks
 * toward a cat is the parasite's transmission route.
 *
 * All round generation, choice prediction, scoring and copy live here; the
 * component only wires state to markup (modularization contract). Rounds are
 * a pure function of a seed via the shared createSeededRandom PRNG, never
 * Math.random(), so the first round is identical on the server and the
 * client's first paint (hydration-safety doctrine, CLAUDE.md #10).
 */

export type OdorCue = 'cat' | 'fox' | 'rabbit' | 'neutral';

export const ODOR_CUES: readonly OdorCue[] = ['cat', 'fox', 'rabbit', 'neutral'];

/** Fixed seed for the very first round — identical on server and client first paint. */
export const INITIAL_ROUND_SEED = 20_001;

/** How long a resolved round lingers before the player can advance. */
export const ROUND_REVEAL_DELAY_MS = 900;

export interface OdorProfile {
  label: string;
  /** Short description of what the odor is, shown on the arm. */
  detail: string;
  /** True for odors of animals that actually predate rodents. */
  predator: boolean;
}

export const ODOR_PROFILES: Record<OdorCue, OdorProfile> = {
  cat: { label: 'Cat', detail: 'Definitive host of T. gondii', predator: true },
  fox: { label: 'Fox', detail: 'Predator, but not a host', predator: true },
  rabbit: { label: 'Rabbit', detail: 'Non-predator animal odor', predator: false },
  neutral: { label: 'Clean', detail: 'No animal odor', predator: false },
};

/**
 * Aversion scores: higher means the rodent works harder to avoid that arm, and
 * a NEGATIVE score means genuine attraction. The rodent enters whichever arm
 * scores lower.
 *
 * Uninfected values encode innate predator-odor avoidance. The infected row
 * changes exactly ONE entry — cat — which is the finding this game exists to
 * teach. Fox stays identically aversive precisely because the real
 * manipulation is specific rather than a general loss of fear.
 */
export const UNINFECTED_AVERSION: Record<OdorCue, number> = {
  cat: 1,
  fox: 1,
  rabbit: 0.25,
  neutral: 0,
};

export const INFECTED_AVERSION: Record<OdorCue, number> = {
  cat: -0.6,
  fox: 1,
  rabbit: 0.25,
  neutral: 0,
};

export function getAversion(infected: boolean, cue: OdorCue): number {
  return infected ? INFECTED_AVERSION[cue] : UNINFECTED_AVERSION[cue];
}

export type MazeArm = 'a' | 'b';

export interface ToxoplasmaRound {
  infected: boolean;
  armA: OdorCue;
  armB: OdorCue;
}

export interface ScoreState {
  score: number;
  streak: number;
  bestStreak: number;
}

export const INITIAL_SCORE_STATE: ScoreState = { score: 0, streak: 0, bestStreak: 0 };

/**
 * Which arm the rodent enters. Lower aversion wins.
 *
 * Ties are resolved to arm A deliberately and deterministically: an uninfected
 * rodent facing cat vs fox finds both equally aversive, and in a real maze the
 * choice would be arbitrary. Rather than fake a coin flip (which would make
 * the round unanswerable and the game feel unfair), the maze's own left arm
 * decides, and the round copy says so.
 */
export function getChosenArm(round: ToxoplasmaRound): MazeArm {
  const aversionA = getAversion(round.infected, round.armA);
  const aversionB = getAversion(round.infected, round.armB);
  return aversionB < aversionA ? 'b' : 'a';
}

/** Is this round a tie — both arms equally aversive to this rodent? */
export function isTiedRound(round: ToxoplasmaRound): boolean {
  return getAversion(round.infected, round.armA) === getAversion(round.infected, round.armB);
}

/**
 * Draws discarded before the first meaningful value is read.
 *
 * `createSeededRandom` is a classic 32-bit LCG
 * (`value = value * 1664525 + 1013904223 mod 2^32`). For any small seed the
 * multiply-plus-increment never wraps 2^32, so its FIRST output is very nearly
 * a linear function of the seed: every seed from 1 to ~2500 yields a first
 * draw between 0.236 and 0.314. A boolean taken from that draw is therefore
 * not a coin flip at all — `random() < 0.5` was `true` for all 200 seeds the
 * test swept, so the maze only ever produced infected rodents and the
 * uninfected control the whole game is built to contrast against never
 * appeared.
 *
 * Discarding a few draws lets the state wrap and decorrelate. This is fixed
 * here rather than inside `createSeededRandom` on purpose: that generator's
 * exact output sequence is pinned by hydration snapshots in the particle
 * engines and the DNA game, so changing it is a far larger blast radius than
 * this bug justifies. Any NEW caller taking a low-entropy decision (especially
 * a boolean) from an early draw needs the same warm-up.
 */
export const PRNG_WARMUP_DRAWS = 3;

/**
 * Generate one deterministic round from a seed: an infection status and two
 * DISTINCT odor arms. The second cue is chosen by offsetting from the first by
 * 1-3 positions (mod 4), which guarantees a different odor in exactly one draw
 * with no rejection-sampling loop.
 */
export function generateRound(seed: number): ToxoplasmaRound {
  const random = createSeededRandom(seed);
  for (let i = 0; i < PRNG_WARMUP_DRAWS; i += 1) random();

  // Stryker: '<' -> '<=' here only diverges from a draw of EXACTLY 0.5
  // (2147483648/4294967296 in the LCG's native fixed-point form). Searched
  // 2,000,000 consecutive seeds computationally (2026-07-26) and found none
  // that produce it after the warm-up draws — not a proof of unreachability
  // (the LCG's full period is 2^32), but real enough that pinning a specific
  // seed to reach it isn't practical. Left as a known, documented gap rather
  // than a false equivalence claim: unlike the -0===0 and total===0 cases
  // elsewhere in this file's siblings, a draw of exactly 0.5 WOULD actually
  // flip the outcome — it just isn't reachable through this module's public
  // seed-based API within a reasonable search.
  const infected = random() < 0.5;
  const firstIndex = Math.floor(random() * ODOR_CUES.length);
  const offset = 1 + Math.floor(random() * (ODOR_CUES.length - 1));
  const secondIndex = (firstIndex + offset) % ODOR_CUES.length;

  return { infected, armA: ODOR_CUES[firstIndex], armB: ODOR_CUES[secondIndex] };
}

/** The deterministic first round, passed to useState by reference. */
export function getInitialRound(): ToxoplasmaRound {
  return generateRound(INITIAL_ROUND_SEED);
}

export function checkPrediction(round: ToxoplasmaRound, predicted: MazeArm): boolean {
  return predicted === getChosenArm(round);
}

/** Correct predictions add a point and extend the streak; wrong ones only reset the streak. */
export function computeScoreUpdate(current: ScoreState, correct: boolean): ScoreState {
  if (!correct) {
    return { score: current.score, streak: 0, bestStreak: current.bestStreak };
  }
  const streak = current.streak + 1;
  return {
    score: current.score + 1,
    streak,
    bestStreak: Math.max(current.bestStreak, streak),
  };
}

/**
 * The scientific explanation for a resolved round — the actual payload of the
 * game. Each branch states the mechanism, not just the outcome.
 */
export function getRoundExplanation(round: ToxoplasmaRound): string {
  const chosen = getChosenArm(round);
  const chosenCue = chosen === 'a' ? round.armA : round.armB;
  const otherCue = chosen === 'a' ? round.armB : round.armA;

  if (isTiedRound(round)) {
    return `Both arms are equally aversive to this rodent, so the choice is arbitrary — the maze's left arm (${ODOR_PROFILES[round.armA].label}) breaks the tie.`;
  }

  if (round.infected && chosenCue === 'cat') {
    return `Infected: it walked toward the cat. T. gondii's aversion-reversal is why — the cat is the parasite's definitive host, so a rodent that approaches one completes the life cycle. It still avoided ${ODOR_PROFILES[otherCue].label.toLowerCase()}.`;
  }

  if (round.infected && otherCue === 'fox') {
    return `Infected, but the fox arm is still avoided. The manipulation is specific to cat odor — infected rodents keep normal aversion to other predators, which is how we know this isn't just general fearlessness.`;
  }

  if (!round.infected && otherCue === 'cat') {
    return `Uninfected: innate cat-odor aversion is intact, so it chose ${ODOR_PROFILES[chosenCue].label.toLowerCase()} instead. This is the baseline the infected animals depart from.`;
  }

  if (ODOR_PROFILES[otherCue].predator) {
    return `Rodents avoid predator odor by default, so it took the ${ODOR_PROFILES[chosenCue].label.toLowerCase()} arm over ${ODOR_PROFILES[otherCue].label.toLowerCase()}.`;
  }

  return `Neither arm smells of a predator, so it settled on the less novel one: ${ODOR_PROFILES[chosenCue].label.toLowerCase()} over ${ODOR_PROFILES[otherCue].label.toLowerCase()}.`;
}

/** Live-region message for a resolved round. */
export function getRoundResultMessage(round: ToxoplasmaRound, correct: boolean): string {
  const verdict = correct ? 'Correct.' : 'Not quite.';
  return `${verdict} ${getRoundExplanation(round)}`;
}

/** Accessible label for one maze arm button. */
export function getArmAriaLabel(cue: OdorCue, arm: MazeArm): string {
  const side = arm === 'a' ? 'Left' : 'Right';
  return `${side} arm, ${ODOR_PROFILES[cue].label} odor. Predict the rodent enters here.`;
}

/** Label describing the rodent's infection status. */
export function getRodentLabel(infected: boolean): string {
  return infected ? 'T. gondii infected' : 'Uninfected control';
}

const ARM_STATE_CLASSES = {
  idle: 'border-white/15 bg-white/5 hover:border-cyan-300/50',
  chosen: 'border-emerald-300 bg-emerald-500/20',
  rejected: 'border-white/10 bg-white/5 opacity-60',
} as const;

export type ArmVisualState = keyof typeof ARM_STATE_CLASSES;

/** Visual state for an arm once the round has resolved. */
export function getArmVisualState(arm: MazeArm, round: ToxoplasmaRound, resolved: boolean): ArmVisualState {
  if (!resolved) return 'idle';
  return getChosenArm(round) === arm ? 'chosen' : 'rejected';
}

export function getArmClassName(state: ArmVisualState): string {
  return ARM_STATE_CLASSES[state];
}

export const MAZE_ARIA_LABEL =
  'Toxoplasma gondii Y-maze odor choice task. Predict which arm the rodent enters, then see the result explained.';
