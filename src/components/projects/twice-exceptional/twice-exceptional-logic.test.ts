import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

import {
  AVERAGE_COMPOSITE_MAX,
  AVERAGE_COMPOSITE_MIN,
  COMPOSITE_JITTER,
  IDENTIFICATION_ARIA_LABEL,
  INITIAL_ROUND_SEED,
  INITIAL_SCORE_STATE,
  NOTABLE_SCATTER_THRESHOLD,
  PRNG_WARMUP_DRAWS,
  PROFILE_COMPOSITE,
  PROFILE_DESCRIPTORS,
  PROFILE_SCATTER,
  SCATTER_JITTER,
  STRENGTH_CATALOG,
  STUDENT_PROFILES,
  applyJitter,
  checkClassification,
  computeScoreUpdate,
  generateCase,
  getCaseExplanation,
  getCaseResultMessage,
  getInitialCase,
  getMaskingSummary,
  getOptionAriaLabel,
  getOptionClassName,
  getOptionVisualState,
  isAverageComposite,
  isNotableScatter,
  pickSignatureStrength,
  type StudentCase,
} from './twice-exceptional-logic';

describe('the masking paradox the game exists to teach', () => {
  it('puts twice-exceptional and typical students in the SAME composite band', () => {
    // The collision is the finding. If a future edit separates these, 2e
    // students become trivially identifiable and the game teaches nothing.
    expect(isAverageComposite(PROFILE_COMPOSITE.typical)).toBe(true);
    expect(isAverageComposite(PROFILE_COMPOSITE['twice-exceptional'])).toBe(true);
  });

  it('keeps their composites within jitter range of each other — genuinely confusable', () => {
    const gap = Math.abs(PROFILE_COMPOSITE['twice-exceptional'] - PROFILE_COMPOSITE.typical);
    expect(gap).toBeLessThanOrEqual(COMPOSITE_JITTER);
  });

  it('separates them decisively on SCATTER instead', () => {
    expect(isNotableScatter(PROFILE_SCATTER['twice-exceptional'])).toBe(true);
    expect(isNotableScatter(PROFILE_SCATTER.typical)).toBe(false);
  });

  it('leaves the scatter bands non-overlapping even at worst-case jitter', () => {
    // Otherwise an unlucky round would be genuinely unanswerable.
    const lowest2e = PROFILE_SCATTER['twice-exceptional'] - SCATTER_JITTER;
    for (const profile of STUDENT_PROFILES) {
      if (profile === 'twice-exceptional') continue;
      expect(PROFILE_SCATTER[profile] + SCATTER_JITTER).toBeLessThan(lowest2e);
    }
  });

  it('gives twice-exceptional students by far the widest scatter', () => {
    for (const profile of STUDENT_PROFILES) {
      if (profile === 'twice-exceptional') continue;
      expect(PROFILE_SCATTER[profile]).toBeLessThan(PROFILE_SCATTER['twice-exceptional']);
    }
  });

  it('places gifted high and disabled low, so those two are separable on composite alone', () => {
    expect(PROFILE_COMPOSITE.gifted).toBeGreaterThan(AVERAGE_COMPOSITE_MAX);
    expect(PROFILE_COMPOSITE.disabled).toBeLessThan(AVERAGE_COMPOSITE_MIN);
  });

  it('describes the masking explicitly in the 2e descriptor', () => {
    expect(PROFILE_DESCRIPTORS['twice-exceptional'].truth).toContain('mask each other');
  });

  it('matches every profile label and truth exactly', () => {
    // label/truth are rendered directly (the classification button text and
    // the result explanation) — load-bearing content, not cosmetic. One
    // exact fixture closes every label/truth string-literal mutant at once.
    expect(PROFILE_DESCRIPTORS).toEqual({
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
    });
  });
});

describe('isAverageComposite / isNotableScatter', () => {
  it('treats the average band as inclusive at both ends', () => {
    expect(isAverageComposite(AVERAGE_COMPOSITE_MIN)).toBe(true);
    expect(isAverageComposite(AVERAGE_COMPOSITE_MAX)).toBe(true);
    expect(isAverageComposite(AVERAGE_COMPOSITE_MIN - 1)).toBe(false);
    expect(isAverageComposite(AVERAGE_COMPOSITE_MAX + 1)).toBe(false);
  });

  it('treats the scatter threshold as inclusive', () => {
    expect(isNotableScatter(NOTABLE_SCATTER_THRESHOLD)).toBe(true);
    expect(isNotableScatter(NOTABLE_SCATTER_THRESHOLD - 1)).toBe(false);
  });

  it('pins the bands', () => {
    expect(AVERAGE_COMPOSITE_MIN).toBe(90);
    expect(AVERAGE_COMPOSITE_MAX).toBe(110);
    expect(NOTABLE_SCATTER_THRESHOLD).toBe(30);
  });
});

describe('applyJitter', () => {
  it('returns the base exactly at the midpoint draw', () => {
    expect(applyJitter(100, 0.5, 6)).toBe(100);
  });

  it('reaches the negative edge at draw 0', () => {
    expect(applyJitter(100, 0, 6)).toBe(94);
  });

  it('approaches the positive edge at draw 1', () => {
    expect(applyJitter(100, 1, 6)).toBe(106);
  });

  it('always returns a whole number', () => {
    for (const draw of [0, 0.13, 0.5, 0.77, 0.99]) {
      expect(Number.isInteger(applyJitter(103, draw, 5))).toBe(true);
    }
  });

  it('never leaves the base +/- spread window', () => {
    for (let i = 0; i <= 100; i += 1) {
      const value = applyJitter(50, i / 100, 7);
      expect(value).toBeGreaterThanOrEqual(43);
      expect(value).toBeLessThanOrEqual(57);
    }
  });
});

describe('generateCase', () => {
  it('is deterministic for a fixed seed', () => {
    expect(generateCase(21)).toEqual(generateCase(21));
  });

  it('produces every profile across a run', () => {
    const seen = new Set(Array.from({ length: 400 }, (_, i) => generateCase(i + 1).profile));
    expect(seen.size).toBe(STUDENT_PROFILES.length);
  });

  it('keeps every generated case inside its profile jitter window', () => {
    for (let seed = 1; seed <= 400; seed += 1) {
      const studentCase = generateCase(seed);
      expect(Math.abs(studentCase.composite - PROFILE_COMPOSITE[studentCase.profile])).toBeLessThanOrEqual(
        COMPOSITE_JITTER
      );
      expect(Math.abs(studentCase.scatter - PROFILE_SCATTER[studentCase.profile])).toBeLessThanOrEqual(SCATTER_JITTER);
    }
  });

  it('makes every generated 2e case answerable from scatter alone', () => {
    // The player must always have a valid signal, never a coin flip.
    for (let seed = 1; seed <= 400; seed += 1) {
      const studentCase = generateCase(seed);
      if (studentCase.profile === 'twice-exceptional') {
        expect(isNotableScatter(studentCase.scatter)).toBe(true);
      } else {
        expect(isNotableScatter(studentCase.scatter)).toBe(false);
      }
    }
  });

  it('consumes its PRNG draws in exactly the documented order', () => {
    const seed = 9090;
    const random = createSeededRandom(seed);
    for (let i = 0; i < PRNG_WARMUP_DRAWS; i += 1) random();
    const profile = STUDENT_PROFILES[Math.floor(random() * STUDENT_PROFILES.length)];
    const composite = applyJitter(PROFILE_COMPOSITE[profile], random(), COMPOSITE_JITTER);
    const scatter = applyJitter(PROFILE_SCATTER[profile], random(), SCATTER_JITTER);
    const signatureStrength = pickSignatureStrength(profile, random());

    expect(generateCase(seed)).toEqual({ profile, composite, scatter, signatureStrength });
  });

  it('warms the PRNG past the seed-correlated opening draws', () => {
    expect(PRNG_WARMUP_DRAWS).toBe(3);
    for (let seed = 1; seed <= 200; seed += 1) {
      expect(createSeededRandom(seed)()).toBeLessThan(0.5);
    }
  });

  it('getInitialCase uses the pinned hydration-safe seed', () => {
    expect(getInitialCase()).toEqual(generateCase(INITIAL_ROUND_SEED));
    expect(INITIAL_ROUND_SEED).toBe(40_013);
  });
});

describe('pickSignatureStrength', () => {
  it('matches every catalog vignette exactly', () => {
    // Every vignette is rendered verbatim in the game and quoted back in the
    // explanation copy — load-bearing content, not filler. One exact fixture
    // closes every string-literal mutant across the whole catalog at once,
    // same pattern as the PROFILE_DESCRIPTORS fixture above.
    expect(STRENGTH_CATALOG).toEqual({
      typical: [
        'Reads at grade level, finishes assignments independently, asks for help when stuck.',
        'Solid, steady work across every subject — no single area stands out.',
        'Organized and reliable; turns in complete work on time.',
      ],
      gifted: [
        'Redesigned the class recycling system unprompted, cost breakdown included.',
        'Explains orbital mechanics to classmates at recess, entirely unasked.',
        'Wrote and illustrated a 40-page fantasy novella over one summer, for fun.',
      ],
      disabled: [
        'Can retell a story in vivid detail out loud but freezes trying to write it down.',
        'Understands every concept discussed in class, then blanks on the written test.',
        'Reads people and rooms with real sensitivity, but decoding a page of text is a wall.',
      ],
      'twice-exceptional': [
        'Debates constitutional law with the teacher, then cannot finish a worksheet.',
        'Builds working catapults from rubber bands and pencils, but loses every homework sheet.',
        'Memorized every dinosaur genus by age six, still cannot copy a spelling list.',
      ],
    });
  });

  it('gives every profile at least one vignette', () => {
    for (const profile of STUDENT_PROFILES) {
      expect(STRENGTH_CATALOG[profile].length).toBeGreaterThan(0);
    }
  });

  it('is a pure lookup: same profile and draw always returns the same vignette', () => {
    for (const profile of STUDENT_PROFILES) {
      expect(pickSignatureStrength(profile, 0.4)).toBe(pickSignatureStrength(profile, 0.4));
    }
  });

  it('never leaves the catalog, at either draw edge', () => {
    for (const profile of STUDENT_PROFILES) {
      const strengths = STRENGTH_CATALOG[profile];
      expect(strengths).toContain(pickSignatureStrength(profile, 0));
      expect(strengths).toContain(pickSignatureStrength(profile, 0.999));
    }
  });

  it('maps each third of the draw range to a distinct index, not always the first', () => {
    // Every catalog currently holds exactly 3 vignettes. A draw*length bug
    // (e.g. draw/length instead) still returns a value FROM the catalog —
    // "never leaves the catalog" above cannot tell them apart — but it always
    // lands on index 0. Pinning the exact index per draw closes that gap.
    for (const profile of STUDENT_PROFILES) {
      const strengths = STRENGTH_CATALOG[profile];
      expect(strengths.length).toBe(3);
      expect(pickSignatureStrength(profile, 0.1)).toBe(strengths[0]);
      expect(pickSignatureStrength(profile, 0.4)).toBe(strengths[1]);
      expect(pickSignatureStrength(profile, 0.9)).toBe(strengths[2]);
    }
  });

  it('pairs a twice-exceptional strength with a visible struggle, not uniform capability', () => {
    // Baum's point: a 2e vignette must read as talent-AND-struggle, or the
    // strength-first framing collapses back into "just gifted."
    for (const vignette of STRENGTH_CATALOG['twice-exceptional']) {
      expect(/but|then|still/.test(vignette)).toBe(true);
    }
  });
});

describe('checkClassification and scoring', () => {
  const twoE: StudentCase = {
    profile: 'twice-exceptional',
    composite: 103,
    scatter: 44,
    signatureStrength: STRENGTH_CATALOG['twice-exceptional'][0],
  };
  const typical: StudentCase = {
    profile: 'typical',
    composite: 101,
    scatter: 11,
    signatureStrength: STRENGTH_CATALOG.typical[0],
  };

  it('accepts only the true profile', () => {
    expect(checkClassification(twoE, 'twice-exceptional')).toBe(true);
    expect(checkClassification(twoE, 'typical')).toBe(false);
  });

  it('scores a correct answer and extends the streak', () => {
    const next = computeScoreUpdate(INITIAL_SCORE_STATE, typical, true);
    expect(next.score).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.bestStreak).toBe(1);
  });

  it('resets the streak but never subtracts score on a miss', () => {
    const next = computeScoreUpdate({ ...INITIAL_SCORE_STATE, score: 5, streak: 4, bestStreak: 6 }, typical, false);
    expect(next.score).toBe(5);
    expect(next.streak).toBe(0);
    expect(next.bestStreak).toBe(6);
  });

  it('counts a twice-exceptional case as seen whether or not it was caught', () => {
    const caught = computeScoreUpdate(INITIAL_SCORE_STATE, twoE, true);
    expect(caught.twiceExceptionalSeen).toBe(1);
    expect(caught.twiceExceptionalCaught).toBe(1);

    const missed = computeScoreUpdate(INITIAL_SCORE_STATE, twoE, false);
    expect(missed.twiceExceptionalSeen).toBe(1);
    expect(missed.twiceExceptionalCaught).toBe(0);
  });

  it('does not count a non-2e case toward the masking tally', () => {
    const next = computeScoreUpdate(INITIAL_SCORE_STATE, typical, true);
    expect(next.twiceExceptionalSeen).toBe(0);
    expect(next.twiceExceptionalCaught).toBe(0);
  });

  it('starts from an all-zero state', () => {
    expect(INITIAL_SCORE_STATE).toEqual({
      score: 0,
      streak: 0,
      bestStreak: 0,
      twiceExceptionalSeen: 0,
      twiceExceptionalCaught: 0,
    });
  });
});

describe('explanations', () => {
  const strengthFor = (profile: StudentCase['profile']) => STRENGTH_CATALOG[profile][0];

  it('names the signature strength as the real entry point for a twice-exceptional case, not just scatter', () => {
    const strength = strengthFor('twice-exceptional');
    const text = getCaseExplanation({ profile: 'twice-exceptional', composite: 103, scatter: 44, signatureStrength: strength });
    expect(text).toContain('44-point scatter');
    expect(text).toContain(strength);
    expect(text).toContain('real entry point');
    expect(text).not.toContain('Scatter is the tell');
  });

  it('names the collision explicitly for an average typical case', () => {
    const text = getCaseExplanation({
      profile: 'typical',
      composite: 100,
      scatter: 11,
      signatureStrength: strengthFor('typical'),
    });
    expect(text).toContain('Same average composite as a twice-exceptional student');
  });

  it('falls back to a plain summary with the strength named for the separable profiles', () => {
    const strength = strengthFor('gifted');
    const text = getCaseExplanation({ profile: 'gifted', composite: 132, scatter: 16, signatureStrength: strength });
    expect(text).toContain('Composite 132, scatter 16');
    expect(text).toContain(strength);
  });

  it('requires BOTH profile===typical AND an average composite for the collision branch', () => {
    // Distinguishes && from || (and from a `profile==='typical'` short-circuit
    // to `true`): a typical profile with a non-average composite, and a
    // non-typical profile with an average composite, must both fall through
    // to the plain summary rather than claiming the collision.
    const typicalButNotAverage = getCaseExplanation({
      profile: 'typical',
      composite: 200,
      scatter: 11,
      signatureStrength: strengthFor('typical'),
    });
    expect(typicalButNotAverage).not.toContain('Same average composite');

    const averageButNotTypical = getCaseExplanation({
      profile: 'gifted',
      composite: 100,
      scatter: 16,
      signatureStrength: strengthFor('gifted'),
    });
    expect(averageButNotTypical).not.toContain('Same average composite');
  });

  it('prefixes an exact verdict, using "Missed" rather than a scold', () => {
    const studentCase: StudentCase = {
      profile: 'gifted',
      composite: 132,
      scatter: 16,
      signatureStrength: strengthFor('gifted'),
    };
    expect(getCaseResultMessage(studentCase, true)).toBe(`Correct. ${getCaseExplanation(studentCase)}`);
    expect(getCaseResultMessage(studentCase, false)).toBe(`Missed. ${getCaseExplanation(studentCase)}`);
  });

  it('produces a substantial explanation for every profile', () => {
    for (const profile of STUDENT_PROFILES) {
      const text = getCaseExplanation({
        profile,
        composite: PROFILE_COMPOSITE[profile],
        scatter: PROFILE_SCATTER[profile],
        signatureStrength: strengthFor(profile),
      });
      expect(text.length).toBeGreaterThan(40);
    }
  });
});

describe('getMaskingSummary', () => {
  it('warns before any 2e case has appeared', () => {
    expect(getMaskingSummary(INITIAL_SCORE_STATE)).toContain('catch you out');
  });

  it('credits a clean record and names why', () => {
    const text = getMaskingSummary({ ...INITIAL_SCORE_STATE, twiceExceptionalSeen: 3, twiceExceptionalCaught: 3 });
    // Asserted with the trailing "s" explicit, not just the leading substring:
    // a ternary that always resolves to the singular '' would still satisfy a
    // bare toContain('caught all 3') check.
    expect(text).toContain('caught all 3 twice-exceptional students');
    expect(text).toContain('reading scatter, not the composite');
  });

  it('reports misses and ties them to the real-world subgroup', () => {
    const text = getMaskingSummary({ ...INITIAL_SCORE_STATE, twiceExceptionalSeen: 4, twiceExceptionalCaught: 1 });
    expect(text).toContain('missed 3 of 4 twice-exceptional students');
    expect(text).toContain('least-served 2e subgroup');
  });

  it('uses singular wording in the MISSED branch for exactly one seen case', () => {
    // The "caught all" branch's singular test below covers L228; this covers
    // the separate ternary in the "missed" branch (L233) — a different string
    // literal the mutation report flagged independently.
    const text = getMaskingSummary({ ...INITIAL_SCORE_STATE, twiceExceptionalSeen: 1, twiceExceptionalCaught: 0 });
    expect(text).toContain('missed 1 of 1 twice-exceptional student.');
    expect(text).not.toContain('twice-exceptional students.');
  });

  it('uses singular wording for exactly one case', () => {
    const text = getMaskingSummary({ ...INITIAL_SCORE_STATE, twiceExceptionalSeen: 1, twiceExceptionalCaught: 1 });
    expect(text).toContain('student so far');
    expect(text).not.toContain('students so far');
  });
});

describe('labels and visual state', () => {
  const studentCase: StudentCase = {
    profile: 'twice-exceptional',
    composite: 103,
    scatter: 44,
    signatureStrength: STRENGTH_CATALOG['twice-exceptional'][0],
  };

  it('names the classification in the option label', () => {
    expect(getOptionAriaLabel('twice-exceptional')).toBe('Classify this student as Twice-exceptional');
  });

  it('leaves every option idle before a choice', () => {
    for (const profile of STUDENT_PROFILES) {
      expect(getOptionVisualState(profile, studentCase, null)).toBe('idle');
    }
  });

  it('always reveals the true profile, even after a wrong pick', () => {
    expect(getOptionVisualState('twice-exceptional', studentCase, 'typical')).toBe('correct');
    expect(getOptionVisualState('typical', studentCase, 'typical')).toBe('wrong');
    expect(getOptionVisualState('gifted', studentCase, 'typical')).toBe('missed');
  });

  it('maps each visual state to a distinct exact class string', () => {
    expect(getOptionClassName('idle')).toBe('border-white/15 bg-white/5 hover:border-cyan-300/50');
    expect(getOptionClassName('correct')).toBe('border-emerald-300 bg-emerald-500/20');
    expect(getOptionClassName('wrong')).toBe('border-rose-300 bg-rose-500/20');
    expect(getOptionClassName('missed')).toBe('border-white/10 bg-white/5 opacity-60');
  });

  it('pins the widget aria-label', () => {
    expect(IDENTIFICATION_ARIA_LABEL).toBe(
      'Twice-exceptional identification task. Read the student assessment summary — signature strength, composite score, and subtest scatter — and classify the student, then see what actually distinguished them.'
    );
  });
});
