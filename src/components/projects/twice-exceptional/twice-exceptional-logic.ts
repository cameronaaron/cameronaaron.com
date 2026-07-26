import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

/**
 * "Who Gets Missed?" — a twice-exceptional identification task paired with the
 * "Bridging Transitions" capstone on thrice-exceptional Black male students.
 *
 * The player reads a student's assessment summary and classifies them. The
 * point is the paradox at the centre of 2e identification, which is genuinely
 * counter-intuitive and is why the population is so badly under-served:
 *
 *   A gifted student with a co-occurring disability often produces a
 *   PERFECTLY AVERAGE composite score, because the two exceptionalities mask
 *   each other. Giftedness compensates for the disability well enough to hide
 *   it; the disability suppresses performance well enough to hide the
 *   giftedness. On a composite, they look like nobody in particular.
 *
 * So the composite score cannot distinguish a twice-exceptional student from a
 * typically-developing one — and a player who classifies on the composite will
 * reliably miss them. What does distinguish them is SCATTER: the spread
 * between a student's own strongest and weakest subtests. Intra-individual
 * discrepancy, not the average, is the signal 2e identification actually turns
 * on. That is why the widget shows both numbers and lets the composite lie.
 *
 * Susan Baum's widely-cited framing describes three 2e subgroups: identified
 * gifted with a hidden disability, identified disabled with hidden
 * giftedness, and — the largest and least served — students in whom both mask
 * each other and NEITHER is identified. The capstone's "thrice-exceptional"
 * framing adds a third compounding layer, race, which pushes identification
 * rates lower again.
 *
 * All profile generation and classification live here (modularization
 * contract). Rounds are a pure function of a seed so the first one is
 * identical on the server and the client's first paint (CLAUDE.md #10).
 */

export type StudentProfile = 'typical' | 'gifted' | 'disabled' | 'twice-exceptional';

export const STUDENT_PROFILES: readonly StudentProfile[] = [
  'typical',
  'gifted',
  'disabled',
  'twice-exceptional',
];

export interface ProfileDescriptor {
  label: string;
  /** What is actually going on with this student. */
  truth: string;
}

export const PROFILE_DESCRIPTORS: Record<StudentProfile, ProfileDescriptor> = {
  typical: {
    label: 'Typically developing',
    truth: 'No identified giftedness and no disability. Subtests cluster tightly around the mean.',
  },
  gifted: {
    label: 'Gifted',
    truth: 'Gifted with no co-occurring disability — the composite is high and the profile is fairly even.',
  },
  disabled: {
    label: 'Disability, not gifted',
    truth: 'A learning disability with no giftedness to offset it, so the composite falls below the mean.',
  },
  'twice-exceptional': {
    label: 'Twice-exceptional',
    truth:
      'Gifted AND disabled. The two mask each other into an average composite, and only the subtest scatter gives it away.',
  },
};

/**
 * Expected composite score per profile.
 *
 * The deliberate collision is `typical` and `twice-exceptional` sitting on
 * essentially the same composite. That is not a modelling convenience — it is
 * the finding. If these two were separable by composite, 2e students would not
 * go unidentified, and the game would have nothing to teach.
 */
export const PROFILE_COMPOSITE: Record<StudentProfile, number> = {
  typical: 100,
  gifted: 132,
  disabled: 84,
  'twice-exceptional': 103,
};

/**
 * Expected subtest scatter (strongest minus weakest) per profile. This is the
 * channel that DOES separate the two colliding profiles: a twice-exceptional
 * student's peaks and valleys are far apart even when their average is not
 * remarkable.
 */
export const PROFILE_SCATTER: Record<StudentProfile, number> = {
  typical: 11,
  gifted: 16,
  disabled: 19,
  'twice-exceptional': 44,
};

/** Scatter at or above this is clinically notable rather than ordinary variation. */
export const NOTABLE_SCATTER_THRESHOLD = 30;

/** Composite band treated as "average" — the band 2e students hide inside. */
export const AVERAGE_COMPOSITE_MIN = 90;
export const AVERAGE_COMPOSITE_MAX = 110;

/** Jitter applied to each generated value so rounds are not identical. */
export const COMPOSITE_JITTER = 6;
export const SCATTER_JITTER = 5;

/** Fixed seed for the first round — identical on server and client first paint. */
export const INITIAL_ROUND_SEED = 40_013;

/**
 * Draws discarded before reading a meaningful value. `createSeededRandom` is
 * an LCG whose first output is nearly linear in a small seed, so an early draw
 * is not uniform — see the Toxoplasma maze's PRNG_WARMUP_DRAWS for the
 * measurement that established this.
 */
export const PRNG_WARMUP_DRAWS = 3;

export interface StudentCase {
  profile: StudentProfile;
  composite: number;
  scatter: number;
}

export interface ScoreState {
  score: number;
  streak: number;
  bestStreak: number;
  /** Twice-exceptional cases seen, and how many the player identified. */
  twiceExceptionalSeen: number;
  twiceExceptionalCaught: number;
}

export const INITIAL_SCORE_STATE: ScoreState = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  twiceExceptionalSeen: 0,
  twiceExceptionalCaught: 0,
};

/** Apply a symmetric jitter around a base value, from a [0, 1) draw. */
export function applyJitter(base: number, draw: number, spread: number): number {
  return Math.round(base + (draw * 2 - 1) * spread);
}

/** Generate one deterministic student case from a seed. */
export function generateCase(seed: number): StudentCase {
  const random = createSeededRandom(seed);
  for (let i = 0; i < PRNG_WARMUP_DRAWS; i += 1) random();

  const profile = STUDENT_PROFILES[Math.floor(random() * STUDENT_PROFILES.length)];
  const composite = applyJitter(PROFILE_COMPOSITE[profile], random(), COMPOSITE_JITTER);
  const scatter = applyJitter(PROFILE_SCATTER[profile], random(), SCATTER_JITTER);

  return { profile, composite, scatter };
}

export function getInitialCase(): StudentCase {
  return generateCase(INITIAL_ROUND_SEED);
}

export function isAverageComposite(composite: number): boolean {
  return composite >= AVERAGE_COMPOSITE_MIN && composite <= AVERAGE_COMPOSITE_MAX;
}

export function isNotableScatter(scatter: number): boolean {
  return scatter >= NOTABLE_SCATTER_THRESHOLD;
}

export function checkClassification(studentCase: StudentCase, chosen: StudentProfile): boolean {
  return chosen === studentCase.profile;
}

export function computeScoreUpdate(current: ScoreState, studentCase: StudentCase, correct: boolean): ScoreState {
  const isTwiceExceptional = studentCase.profile === 'twice-exceptional';
  const twiceExceptionalSeen = current.twiceExceptionalSeen + (isTwiceExceptional ? 1 : 0);
  const twiceExceptionalCaught = current.twiceExceptionalCaught + (isTwiceExceptional && correct ? 1 : 0);

  if (!correct) {
    return { ...current, streak: 0, twiceExceptionalSeen, twiceExceptionalCaught };
  }

  const streak = current.streak + 1;
  return {
    score: current.score + 1,
    streak,
    bestStreak: Math.max(current.bestStreak, streak),
    twiceExceptionalSeen,
    twiceExceptionalCaught,
  };
}

/**
 * The explanation for a resolved case. The twice-exceptional branch names the
 * masking explicitly, and the "typical" branch names the contrast, because
 * those two are the pair the player has to learn to separate.
 */
export function getCaseExplanation(studentCase: StudentCase): string {
  const descriptor = PROFILE_DESCRIPTORS[studentCase.profile];

  if (studentCase.profile === 'twice-exceptional') {
    return `${descriptor.truth} Composite ${studentCase.composite} looks unremarkable — but a ${studentCase.scatter}-point spread between strongest and weakest subtests does not. Scatter is the tell.`;
  }

  if (studentCase.profile === 'typical' && isAverageComposite(studentCase.composite)) {
    return `${descriptor.truth} Same average composite as a twice-exceptional student, and that is exactly the problem — only the low ${studentCase.scatter}-point scatter separates them.`;
  }

  return `${descriptor.truth} Composite ${studentCase.composite}, scatter ${studentCase.scatter}.`;
}

export function getCaseResultMessage(studentCase: StudentCase, correct: boolean): string {
  return `${correct ? 'Correct.' : 'Missed.'} ${getCaseExplanation(studentCase)}`;
}

/** Running commentary on how well the player is catching the masked cases. */
export function getMaskingSummary(state: ScoreState): string {
  if (state.twiceExceptionalSeen === 0) {
    return 'No twice-exceptional students yet. They are the ones that will catch you out.';
  }

  const missed = state.twiceExceptionalSeen - state.twiceExceptionalCaught;
  if (missed === 0) {
    return `You have caught all ${state.twiceExceptionalSeen} twice-exceptional student${
      state.twiceExceptionalSeen === 1 ? '' : 's'
    } so far — you are reading scatter, not the composite.`;
  }

  return `You have missed ${missed} of ${state.twiceExceptionalSeen} twice-exceptional student${
    state.twiceExceptionalSeen === 1 ? '' : 's'
  }. In real systems that is the largest and least-served 2e subgroup: masked by their own compensation.`;
}

export function getOptionAriaLabel(profile: StudentProfile): string {
  return `Classify this student as ${PROFILE_DESCRIPTORS[profile].label}`;
}

const OPTION_STATE_CLASSES = {
  idle: 'border-white/15 bg-white/5 hover:border-cyan-300/50',
  correct: 'border-emerald-300 bg-emerald-500/20',
  wrong: 'border-rose-300 bg-rose-500/20',
  missed: 'border-white/10 bg-white/5 opacity-60',
} as const;

export type OptionVisualState = keyof typeof OPTION_STATE_CLASSES;

export function getOptionVisualState(
  profile: StudentProfile,
  studentCase: StudentCase,
  chosen: StudentProfile | null
): OptionVisualState {
  if (chosen === null) return 'idle';
  if (profile === studentCase.profile) return 'correct';
  if (profile === chosen) return 'wrong';
  return 'missed';
}

export function getOptionClassName(state: OptionVisualState): string {
  return OPTION_STATE_CLASSES[state];
}

export const IDENTIFICATION_ARIA_LABEL =
  'Twice-exceptional identification task. Read the student assessment summary and classify the student, then see what the scores actually indicated.';
