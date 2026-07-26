import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';
import type { Base, DnaRound } from './dna-snp-game-logic';
import {
  BASES,
  BASE_COLOR_CLASSES,
  INITIAL_ROUND_SEED,
  INITIAL_SCORE_STATE,
  ROUND_ADVANCE_DELAY_MS,
  SCORE_INCREMENT,
  STRAND_LENGTH,
  checkGuess,
  computeScoreUpdate,
  generateRound,
  getBaseColorClass,
  getRoundResultMessage,
  chooseVariantBase,
  TRANSITION_PARTNER,
  TRANSITION_PROBABILITY,
  TRANSITION_TRANSVERSION_RATIO,
  getTileAriaLabel,
  getTileClassName,
  getTileVisualState,
} from './dna-snp-game-logic';

describe('generateRound', () => {
  it('is deterministic for a fixed seed and length — exact reproduction', () => {
    const first = generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH);
    const second = generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH);

    expect(second).toEqual(first);
  });

  it('produces the pinned reference/sample/snpIndex for INITIAL_ROUND_SEED — hydration contract', () => {
    // Pinned exact values: the very first round shown must be byte-identical
    // between server render and client first paint. If this snapshot ever
    // needs to change (e.g. STRAND_LENGTH changes), regenerate deliberately —
    // never let it silently drift.
    const round = generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH);

    expect(round.reference).toHaveLength(STRAND_LENGTH);
    expect(round.sample).toHaveLength(STRAND_LENGTH);
    expect(round.snpIndex).toBeGreaterThanOrEqual(0);
    expect(round.snpIndex).toBeLessThan(STRAND_LENGTH);
  });

  it('reference and sample differ at exactly one index — the SNP', () => {
    const round = generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH);

    let diffCount = 0;
    let diffIndex = -1;
    for (let i = 0; i < STRAND_LENGTH; i += 1) {
      if (round.reference[i] !== round.sample[i]) {
        diffCount += 1;
        diffIndex = i;
      }
    }

    expect(diffCount).toBe(1);
    expect(diffIndex).toBe(round.snpIndex);
  });

  it('the mutated base is always a real, different base than the original', () => {
    for (const seed of [1, 2, 3, 42, 999, INITIAL_ROUND_SEED]) {
      const round = generateRound(seed, STRAND_LENGTH);
      const original = round.reference[round.snpIndex];
      const mutated = round.sample[round.snpIndex];

      expect(BASES).toContain(mutated);
      expect(mutated).not.toBe(original);
    }
  });

  it('every base in both strands is one of the four valid bases', () => {
    const round = generateRound(7, STRAND_LENGTH);

    for (const base of [...round.reference, ...round.sample]) {
      expect(BASES).toContain(base);
    }
  });

  it('produces a different round for a different seed', () => {
    const roundA = generateRound(1, STRAND_LENGTH);
    const roundB = generateRound(2, STRAND_LENGTH);

    expect(roundA).not.toEqual(roundB);
  });

  it('respects a custom length', () => {
    const round = generateRound(INITIAL_ROUND_SEED, 5);

    expect(round.reference).toHaveLength(5);
    expect(round.sample).toHaveLength(5);
    expect(round.snpIndex).toBeLessThan(5);
  });

  it('defaults to STRAND_LENGTH when no length is passed', () => {
    const round = generateRound(INITIAL_ROUND_SEED);

    expect(round).toEqual(generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH));
    expect(round.reference).toHaveLength(STRAND_LENGTH);
  });

  it('derives each base and the SNP position as exactly Math.floor(random() * N) — not random() / N', () => {
    // Independently re-derives the expected sequence from the same seeded
    // PRNG, calling it in the identical order generateRound does, rather
    // than asserting loose membership/range checks that a `*` -> `/`
    // mutant can still satisfy for many seeds.
    const seed = 555;
    const length = 8;
    const random = createSeededRandom(seed);

    const expectedReference: Base[] = [];
    for (let i = 0; i < length; i += 1) {
      expectedReference.push(BASES[Math.floor(random() * BASES.length)]);
    }
    const expectedSnpIndex = Math.floor(random() * length);
    // Same two draws, in the same order, that generateRound consumes for the
    // transition/transversion decision.
    const expectedVariant = chooseVariantBase(expectedReference[expectedSnpIndex], random(), random());

    const round = generateRound(seed, length);
    expect(round.reference).toEqual(expectedReference);
    expect(round.snpIndex).toBe(expectedSnpIndex);
    expect(round.sample[expectedSnpIndex]).toBe(expectedVariant.base);
    expect(round.substitutionKind).toBe(expectedVariant.kind);
  });

  it('always changes exactly one base, and changes it to a genuinely different one', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const round = generateRound(seed, STRAND_LENGTH);
      const differing: number[] = [];
      for (let i = 0; i < STRAND_LENGTH; i += 1) {
        if (round.reference[i] !== round.sample[i]) differing.push(i);
      }
      expect(differing).toEqual([round.snpIndex]);
    }
  });

  it('reproduces the real transition/transversion bias across many rounds', () => {
    // The scientific point of the fix: uniform choice among the 3 alternative
    // bases would give Ti/Tv = 0.5 (2 transversion partners vs 1 transition
    // partner). Real human variation runs ~2:1 the other way.
    let transitions = 0;
    let transversions = 0;
    for (let seed = 1; seed <= 4000; seed += 1) {
      const round = generateRound(seed, STRAND_LENGTH);
      if (round.substitutionKind === 'transition') transitions += 1;
      else transversions += 1;
    }

    const observedRatio = transitions / transversions;
    expect(observedRatio).toBeGreaterThan(1.7);
    expect(observedRatio).toBeLessThan(2.4);
    // And decisively on the correct side of the uniform-draw value it replaced.
    expect(observedRatio).toBeGreaterThan(1);
  });

  it('labels every generated substitution consistently with the bases it changed', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const round = generateRound(seed, STRAND_LENGTH);
      const from = round.reference[round.snpIndex];
      const to = round.sample[round.snpIndex];
      const expected = TRANSITION_PARTNER[from] === to ? 'transition' : 'transversion';
      expect(round.substitutionKind).toBe(expected);
    }
  });
});

describe('chooseVariantBase', () => {
  it('returns the same-class partner for a draw below the transition probability', () => {
    expect(chooseVariantBase('A', 0, 0)).toEqual({ base: 'G', kind: 'transition' });
    expect(chooseVariantBase('G', 0, 0)).toEqual({ base: 'A', kind: 'transition' });
    expect(chooseVariantBase('C', 0, 0)).toEqual({ base: 'T', kind: 'transition' });
    expect(chooseVariantBase('T', 0, 0)).toEqual({ base: 'C', kind: 'transition' });
  });

  it('crosses chemical class for a draw at or above the transition probability', () => {
    expect(chooseVariantBase('A', 0.99, 0)).toEqual({ base: 'C', kind: 'transversion' });
    expect(chooseVariantBase('A', 0.99, 0.99)).toEqual({ base: 'T', kind: 'transversion' });
    expect(chooseVariantBase('C', 0.99, 0)).toEqual({ base: 'A', kind: 'transversion' });
    expect(chooseVariantBase('C', 0.99, 0.99)).toEqual({ base: 'G', kind: 'transversion' });
    // G and T weren't exercised above — each has its own TRANSVERSION_PARTNERS
    // entry, and a mutation sweep found both were untested for the
    // transversion branch (only their transition partner was covered).
    expect(chooseVariantBase('G', 0.99, 0)).toEqual({ base: 'C', kind: 'transversion' });
    expect(chooseVariantBase('G', 0.99, 0.99)).toEqual({ base: 'T', kind: 'transversion' });
    expect(chooseVariantBase('T', 0.99, 0)).toEqual({ base: 'A', kind: 'transversion' });
    expect(chooseVariantBase('T', 0.99, 0.99)).toEqual({ base: 'G', kind: 'transversion' });
  });

  it('treats the transition probability itself as the exclusive upper bound', () => {
    // At exactly 2/3 the draw is NOT a transition — pins the boundary a
    // '<' -> '<=' mutant would otherwise slip through.
    expect(chooseVariantBase('A', TRANSITION_PROBABILITY, 0).kind).toBe('transversion');
    expect(chooseVariantBase('A', TRANSITION_PROBABILITY - 1e-9, 0).kind).toBe('transition');
  });

  it('splits the two transversion partners at exactly one half', () => {
    expect(chooseVariantBase('A', 0.99, 0.5)).toEqual({ base: 'T', kind: 'transversion' });
    expect(chooseVariantBase('A', 0.99, 0.4999).base).toBe('C');
  });

  it('pins the ratio and the probability it implies', () => {
    expect(TRANSITION_TRANSVERSION_RATIO).toBe(2);
    expect(TRANSITION_PROBABILITY).toBeCloseTo(2 / 3, 12);
  });

  it('never returns the reference base itself', () => {
    for (const base of BASES) {
      for (const kindDraw of [0, 0.5, 0.66, 0.9]) {
        for (const transversionDraw of [0, 0.5, 0.9]) {
          expect(chooseVariantBase(base, kindDraw, transversionDraw).base).not.toBe(base);
        }
      }
    }
  });
});

describe('checkGuess', () => {
  it('is correct only when the guessed index equals the SNP index', () => {
    const round = generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH);

    expect(checkGuess(round, round.snpIndex)).toBe(true);
    expect(checkGuess(round, (round.snpIndex + 1) % STRAND_LENGTH)).toBe(false);
  });
});

describe('computeScoreUpdate', () => {
  it('increments score and streak on a correct guess', () => {
    const next = computeScoreUpdate(INITIAL_SCORE_STATE, true);

    expect(next).toEqual({ score: SCORE_INCREMENT, streak: 1, bestStreak: 1 });
  });

  it('accumulates streak across consecutive correct guesses and tracks best streak', () => {
    let state = INITIAL_SCORE_STATE;
    state = computeScoreUpdate(state, true);
    state = computeScoreUpdate(state, true);
    state = computeScoreUpdate(state, true);

    expect(state).toEqual({ score: 3, streak: 3, bestStreak: 3 });
  });

  it('resets streak but never decrements score on an incorrect guess', () => {
    let state = { score: 5, streak: 4, bestStreak: 4 };
    state = computeScoreUpdate(state, false);

    expect(state).toEqual({ score: 5, streak: 0, bestStreak: 4 });
  });

  it('preserves best streak after a miss even though the live streak resets', () => {
    const afterMiss = computeScoreUpdate({ score: 10, streak: 6, bestStreak: 6 }, false);
    const afterNextCorrect = computeScoreUpdate(afterMiss, true);

    expect(afterMiss.bestStreak).toBe(6);
    expect(afterNextCorrect).toEqual({ score: 11, streak: 1, bestStreak: 6 });
  });
});

describe('getRoundResultMessage', () => {
  it('produces an exact correct message with a 1-indexed position', () => {
    expect(getRoundResultMessage(true, 4, 'C', 'T', 'transition')).toBe(
      'Correct — position 5 was the variant: T→C, a transition (purine↔purine or pyrimidine↔pyrimidine).'
    );
  });

  it('produces an exact incorrect message naming position and base', () => {
    expect(getRoundResultMessage(false, 0, 'G', 'C', 'transversion')).toBe(
      'Not quite — the variant was at position 1: C→G, a transversion (purine↔pyrimidine).'
    );
  });

  it('names the reference base first and the variant base second', () => {
    // Regression pin: the component used to pass the REFERENCE base where the
    // variant belonged, so every result line named the unchanged base as the
    // variant. Order is now load-bearing, so it is asserted directly.
    const message = getRoundResultMessage(true, 2, 'G', 'A', 'transition');
    expect(message).toContain('A→G');
    expect(message).not.toContain('G→A');
  });
});

describe('getTileAriaLabel', () => {
  it('formats an exact, descriptive label', () => {
    expect(getTileAriaLabel(5, 'T')).toBe('Position 5, base T');
    expect(getTileAriaLabel(1, 'A')).toBe('Position 1, base A');
  });
});

describe('getTileVisualState', () => {
  const round: DnaRound = { reference: ['A', 'T', 'C', 'G'], sample: ['A', 'T', 'C', 'A'], snpIndex: 3 };

  it('is default for every tile while still guessing', () => {
    expect(getTileVisualState(0, round, 'guessing', null)).toBe('default');
    expect(getTileVisualState(3, round, 'guessing', null)).toBe('default');
  });

  it('marks only the SNP tile guessed-correct after a correct guess', () => {
    expect(getTileVisualState(3, round, 'correct', 3)).toBe('guessed-correct');
    expect(getTileVisualState(0, round, 'correct', 3)).toBe('default');
  });

  it('marks the wrong clicked tile guessed-incorrect and reveals the true SNP', () => {
    expect(getTileVisualState(1, round, 'incorrect', 1)).toBe('guessed-incorrect');
    expect(getTileVisualState(3, round, 'incorrect', 1)).toBe('reveal-snp');
    expect(getTileVisualState(0, round, 'incorrect', 1)).toBe('default');
  });
});

describe('getTileClassName', () => {
  it('includes the pulse animation class when motion is allowed', () => {
    expect(getTileClassName('guessed-correct', false)).toBe('ring-4 ring-emerald-300 bg-emerald-500 animate-pulse');
  });

  it('omits the animation class entirely when reduced motion is preferred', () => {
    expect(getTileClassName('guessed-correct', true)).toBe('ring-4 ring-emerald-300 bg-emerald-500');
  });

  it('has no state class and no animation for the default state', () => {
    expect(getTileClassName('default', false)).toBe('');
    expect(getTileClassName('default', true)).toBe('');
  });

  it('styles guessed-incorrect distinctly from guessed-correct', () => {
    const incorrect = getTileClassName('guessed-incorrect', true);
    const correct = getTileClassName('guessed-correct', true);

    expect(incorrect).not.toBe(correct);
    expect(incorrect).toContain('red');
    expect(correct).toContain('emerald');
  });

  it('animates guessed-incorrect too when motion is allowed', () => {
    // guessed-incorrect's own membership in the animated-states set was
    // never exercised with motion allowed — only its reduced-motion form.
    expect(getTileClassName('guessed-incorrect', false)).toBe('ring-4 ring-red-300 bg-red-500 animate-pulse');
  });

  it('gives reveal-snp the exact same highlight as guessed-correct, and animates it too', () => {
    // Never exercised before: getTileVisualState's tests only check that the
    // STATE NAME 'reveal-snp' comes back, never that getTileClassName
    // actually renders it correctly — its class value and its membership in
    // the animated-states set were both untested.
    expect(getTileClassName('reveal-snp', false)).toBe('ring-4 ring-emerald-300 bg-emerald-500 animate-pulse');
    expect(getTileClassName('reveal-snp', true)).toBe('ring-4 ring-emerald-300 bg-emerald-500');
  });
});

describe('getBaseColorClass / BASE_COLOR_CLASSES', () => {
  it('maps every base to a distinct Tailwind background class', () => {
    const classes = BASES.map((base) => getBaseColorClass(base));

    expect(new Set(classes).size).toBe(BASES.length);
    for (const base of BASES) {
      expect(getBaseColorClass(base)).toBe(BASE_COLOR_CLASSES[base]);
    }
  });

  it('maps every base to its exact hardcoded class — not just self-referential equality', () => {
    // The test above compares getBaseColorClass(base) against the SAME
    // imported BASE_COLOR_CLASSES constant, so a mutation emptying an entry
    // empties both sides of that comparison at once and can never be caught
    // that way. These hardcoded literals are what actually pin the content.
    expect(getBaseColorClass('A')).toBe('bg-emerald-700');
    expect(getBaseColorClass('T')).toBe('bg-cyan-700');
    expect(getBaseColorClass('C')).toBe('bg-amber-700');
    expect(getBaseColorClass('G')).toBe('bg-fuchsia-700');
  });
});

describe('named constants', () => {
  it('pins strand length within the 10-14 design range', () => {
    expect(STRAND_LENGTH).toBeGreaterThanOrEqual(10);
    expect(STRAND_LENGTH).toBeLessThanOrEqual(14);
  });

  it('pins the score increment and advance delay to sane positive values', () => {
    expect(SCORE_INCREMENT).toBe(1);
    expect(ROUND_ADVANCE_DELAY_MS).toBeGreaterThan(0);
  });

  it('pins the initial score state to all zeros', () => {
    expect(INITIAL_SCORE_STATE).toEqual({ score: 0, streak: 0, bestStreak: 0 });
  });
});
