import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

import {
  INFECTED_AVERSION,
  INITIAL_ROUND_SEED,
  INITIAL_SCORE_STATE,
  MAZE_ARIA_LABEL,
  ODOR_CUES,
  ODOR_PROFILES,
  PRNG_WARMUP_DRAWS,
  ROUND_REVEAL_DELAY_MS,
  UNINFECTED_AVERSION,
  checkPrediction,
  computeScoreUpdate,
  generateRound,
  getArmAriaLabel,
  getArmClassName,
  getArmVisualState,
  getAversion,
  getChosenArm,
  getInitialRound,
  getRodentLabel,
  getRoundExplanation,
  getRoundResultMessage,
  isTiedRound,
  type ToxoplasmaRound,
} from './toxoplasma-logic';

describe('aversion model — the science the game encodes', () => {
  it('gives uninfected rodents strong aversion to BOTH predator odors', () => {
    expect(UNINFECTED_AVERSION.cat).toBe(1);
    expect(UNINFECTED_AVERSION.fox).toBe(1);
  });

  it('inverts cat aversion into attraction only when infected', () => {
    // The single finding this whole game exists to teach.
    expect(UNINFECTED_AVERSION.cat).toBeGreaterThan(0);
    expect(INFECTED_AVERSION.cat).toBeLessThan(0);
  });

  it('leaves fox aversion IDENTICAL when infected — the specificity result', () => {
    // If infection were general fearlessness, this would drop too. It must not:
    // infected rats keep normal aversion to non-host predators.
    expect(INFECTED_AVERSION.fox).toBe(UNINFECTED_AVERSION.fox);
  });

  it('changes exactly one odor between the two profiles', () => {
    const changed = ODOR_CUES.filter((cue) => INFECTED_AVERSION[cue] !== UNINFECTED_AVERSION[cue]);
    expect(changed).toEqual(['cat']);
  });

  it('treats non-predator odors as mildly or non-aversive in both states', () => {
    for (const profile of [UNINFECTED_AVERSION, INFECTED_AVERSION]) {
      expect(profile.neutral).toBe(0);
      expect(profile.rabbit).toBe(0.25);
    }
  });

  it('classifies exactly cat and fox as predators', () => {
    const predators = ODOR_CUES.filter((cue) => ODOR_PROFILES[cue].predator);
    expect(predators).toEqual(['cat', 'fox']);
  });

  it('names the cat as the definitive host in its profile copy', () => {
    expect(ODOR_PROFILES.cat.detail).toBe('Definitive host of T. gondii');
    expect(ODOR_PROFILES.fox.detail).toBe('Predator, but not a host');
    expect(ODOR_PROFILES.rabbit.detail).toBe('Non-predator animal odor');
    expect(ODOR_PROFILES.neutral.detail).toBe('No animal odor');
  });

  it('getAversion selects the profile matching infection status', () => {
    expect(getAversion(false, 'cat')).toBe(1);
    expect(getAversion(true, 'cat')).toBe(-0.6);
    expect(getAversion(true, 'fox')).toBe(1);
    expect(getAversion(false, 'neutral')).toBe(0);
  });
});

describe('getChosenArm', () => {
  it('sends an uninfected rodent away from cat odor', () => {
    expect(getChosenArm({ infected: false, armA: 'cat', armB: 'neutral' })).toBe('b');
    expect(getChosenArm({ infected: false, armA: 'neutral', armB: 'cat' })).toBe('a');
  });

  it('sends an INFECTED rodent toward cat odor — fatal feline attraction', () => {
    expect(getChosenArm({ infected: true, armA: 'cat', armB: 'neutral' })).toBe('a');
    expect(getChosenArm({ infected: true, armA: 'neutral', armB: 'cat' })).toBe('b');
  });

  it('still sends an infected rodent away from fox odor', () => {
    // The trap for anyone who over-generalises to "infected = fearless".
    expect(getChosenArm({ infected: true, armA: 'fox', armB: 'neutral' })).toBe('b');
    expect(getChosenArm({ infected: true, armA: 'neutral', armB: 'fox' })).toBe('a');
  });

  it('prefers cat over fox when infected — the two predators diverge', () => {
    expect(getChosenArm({ infected: true, armA: 'cat', armB: 'fox' })).toBe('a');
    expect(getChosenArm({ infected: true, armA: 'fox', armB: 'cat' })).toBe('b');
  });

  it('prefers a clean arm over a rabbit arm', () => {
    expect(getChosenArm({ infected: false, armA: 'rabbit', armB: 'neutral' })).toBe('b');
    expect(getChosenArm({ infected: true, armA: 'rabbit', armB: 'neutral' })).toBe('b');
  });

  it('breaks an exact tie toward arm A, deterministically', () => {
    const tied: ToxoplasmaRound = { infected: false, armA: 'cat', armB: 'fox' };
    expect(isTiedRound(tied)).toBe(true);
    expect(getChosenArm(tied)).toBe('a');
  });

  it('is not tied when infection has separated the two predators', () => {
    expect(isTiedRound({ infected: true, armA: 'cat', armB: 'fox' })).toBe(false);
  });
});

describe('generateRound', () => {
  it('is deterministic for a fixed seed', () => {
    expect(generateRound(7)).toEqual(generateRound(7));
  });

  it('produces different rounds for different seeds somewhere in a run', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const round = generateRound(seed);
      seen.add(`${round.infected}-${round.armA}-${round.armB}`);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('never puts the same odor in both arms', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const round = generateRound(seed);
      expect(round.armA).not.toBe(round.armB);
    }
  });

  it('only ever emits real odor cues', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const round = generateRound(seed);
      expect(ODOR_CUES).toContain(round.armA);
      expect(ODOR_CUES).toContain(round.armB);
    }
  });

  it('produces both infected and uninfected rodents, in roughly equal share', () => {
    // Regression pin for a real defect: createSeededRandom is an LCG whose
    // FIRST draw is nearly linear in a small seed (always ~0.236-0.314), so
    // `random() < 0.5` was true for every seed and the uninfected control the
    // game exists to contrast against never appeared. See PRNG_WARMUP_DRAWS.
    let infected = 0;
    const runs = 400;
    for (let seed = 1; seed <= runs; seed += 1) {
      if (generateRound(seed).infected) infected += 1;
    }
    expect(infected).toBeGreaterThan(runs * 0.3);
    expect(infected).toBeLessThan(runs * 0.7);
  });

  it('warms the PRNG past the seed-correlated opening draws', () => {
    expect(PRNG_WARMUP_DRAWS).toBeGreaterThan(0);
    // Prove the hazard is real, so this constant can never be "cleaned up"
    // by someone who assumes the raw first draw is uniform.
    for (let seed = 1; seed <= 200; seed += 1) {
      expect(createSeededRandom(seed)()).toBeLessThan(0.5);
    }
  });

  it('consumes its PRNG draws in exactly the documented order', () => {
    // Re-derives the round independently from the same seeded PRNG rather than
    // asserting loose membership a '*' -> '/' mutant could still satisfy.
    const seed = 4242;
    const random = createSeededRandom(seed);
    for (let i = 0; i < PRNG_WARMUP_DRAWS; i += 1) random();
    const expectedInfected = random() < 0.5;
    const firstIndex = Math.floor(random() * ODOR_CUES.length);
    const offset = 1 + Math.floor(random() * (ODOR_CUES.length - 1));
    const secondIndex = (firstIndex + offset) % ODOR_CUES.length;

    expect(generateRound(seed)).toEqual({
      infected: expectedInfected,
      armA: ODOR_CUES[firstIndex],
      armB: ODOR_CUES[secondIndex],
    });
  });

  it('getInitialRound uses the pinned hydration-safe seed', () => {
    expect(getInitialRound()).toEqual(generateRound(INITIAL_ROUND_SEED));
    expect(INITIAL_ROUND_SEED).toBe(20_001);
  });
});

describe('checkPrediction', () => {
  it('is correct only when the predicted arm matches the chosen arm', () => {
    const round: ToxoplasmaRound = { infected: true, armA: 'cat', armB: 'neutral' };
    expect(checkPrediction(round, 'a')).toBe(true);
    expect(checkPrediction(round, 'b')).toBe(false);
  });
});

describe('computeScoreUpdate', () => {
  it('adds a point and extends the streak on a correct prediction', () => {
    expect(computeScoreUpdate({ score: 2, streak: 1, bestStreak: 3 }, true)).toEqual({
      score: 3,
      streak: 2,
      bestStreak: 3,
    });
  });

  it('raises the best streak once the current streak passes it', () => {
    expect(computeScoreUpdate({ score: 5, streak: 5, bestStreak: 5 }, true)).toEqual({
      score: 6,
      streak: 6,
      bestStreak: 6,
    });
  });

  it('resets the streak but never subtracts score on a wrong prediction', () => {
    expect(computeScoreUpdate({ score: 4, streak: 3, bestStreak: 7 }, false)).toEqual({
      score: 4,
      streak: 0,
      bestStreak: 7,
    });
  });

  it('starts from an all-zero state', () => {
    expect(INITIAL_SCORE_STATE).toEqual({ score: 0, streak: 0, bestStreak: 0 });
  });
});

describe('getRoundExplanation — the teaching payload', () => {
  it('explains the aversion reversal when an infected rodent picks the cat', () => {
    const text = getRoundExplanation({ infected: true, armA: 'cat', armB: 'neutral' });
    expect(text).toContain('definitive host');
    expect(text).toContain('completes the life cycle');
    // Names the OTHER arm's exact lowercase label — a mutant swapping
    // toLowerCase() for toUpperCase() would produce "CLEAN" instead.
    expect(text).toContain('It still avoided clean.');
  });

  it('explains SPECIFICITY when an infected rodent still avoids the fox', () => {
    const text = getRoundExplanation({ infected: true, armA: 'neutral', armB: 'fox' });
    expect(text).toContain('specific to cat odor');
    expect(text).toContain("isn't just general fearlessness");
  });

  it('does NOT claim fox-specificity for an infected round with no fox in it', () => {
    // Regression pin: a mutant collapsing `round.infected && otherCue ===
    // 'fox'` down to just `round.infected` would fire this branch for ANY
    // infected round, even one with neither cat nor fox present.
    const text = getRoundExplanation({ infected: true, armA: 'rabbit', armB: 'neutral' });
    expect(text).not.toContain('fox');
    expect(text).toBe('Neither arm smells of a predator, so it settled on the less novel one: clean over rabbit.');
  });

  it('frames the uninfected cat round as the baseline', () => {
    const text = getRoundExplanation({ infected: false, armA: 'cat', armB: 'neutral' });
    expect(text).toContain('innate cat-odor aversion is intact');
    expect(text).toContain('baseline');
    // Names the CHOSEN arm's exact lowercase label — a mutant swapping
    // toLowerCase() for toUpperCase() would produce "CLEAN" instead, and a
    // mutant collapsing the chosenCue ternary to always-armA would say "cat"
    // instead of "clean" (the rodent chose the non-cat arm here).
    expect(text).toContain('so it chose clean instead');
  });

  it('says so plainly when the round is an arbitrary tie', () => {
    const text = getRoundExplanation({ infected: false, armA: 'cat', armB: 'fox' });
    expect(text).toContain('equally aversive');
    expect(text).toContain('left arm');
  });

  it('falls back to plain predator avoidance for a non-cat predator round', () => {
    const text = getRoundExplanation({ infected: false, armA: 'rabbit', armB: 'fox' });
    expect(text).toBe('Rodents avoid predator odor by default, so it took the rabbit arm over fox.');
  });

  it('handles a round with no predator in either arm', () => {
    const text = getRoundExplanation({ infected: false, armA: 'neutral', armB: 'rabbit' });
    expect(text).toBe('Neither arm smells of a predator, so it settled on the less novel one: clean over rabbit.');
  });

  it('produces a non-empty explanation for every reachable round', () => {
    for (const infected of [true, false]) {
      for (const armA of ODOR_CUES) {
        for (const armB of ODOR_CUES) {
          if (armA === armB) continue;
          expect(getRoundExplanation({ infected, armA, armB }).length).toBeGreaterThan(20);
        }
      }
    }
  });
});

describe('getRoundResultMessage', () => {
  it('prefixes the explanation with an exact verdict', () => {
    const round: ToxoplasmaRound = { infected: true, armA: 'cat', armB: 'neutral' };
    expect(getRoundResultMessage(round, true)).toBe(`Correct. ${getRoundExplanation(round)}`);
    expect(getRoundResultMessage(round, false)).toBe(`Not quite. ${getRoundExplanation(round)}`);
  });
});

describe('labels and visual state', () => {
  it('names the side and the odor in an arm label', () => {
    expect(getArmAriaLabel('cat', 'a')).toBe('Left arm, Cat odor. Predict the rodent enters here.');
    expect(getArmAriaLabel('fox', 'b')).toBe('Right arm, Fox odor. Predict the rodent enters here.');
  });

  it('states infection status in plain words', () => {
    expect(getRodentLabel(true)).toBe('T. gondii infected');
    expect(getRodentLabel(false)).toBe('Uninfected control');
  });

  it('leaves both arms idle until the round resolves', () => {
    const round: ToxoplasmaRound = { infected: true, armA: 'cat', armB: 'neutral' };
    expect(getArmVisualState('a', round, false)).toBe('idle');
    expect(getArmVisualState('b', round, false)).toBe('idle');
  });

  it('marks the chosen arm and dims the other once resolved', () => {
    const round: ToxoplasmaRound = { infected: true, armA: 'cat', armB: 'neutral' };
    expect(getArmVisualState('a', round, true)).toBe('chosen');
    expect(getArmVisualState('b', round, true)).toBe('rejected');
  });

  it('maps each visual state to a distinct exact class string', () => {
    expect(getArmClassName('idle')).toBe('border-white/15 bg-white/5 hover:border-cyan-300/50');
    expect(getArmClassName('chosen')).toBe('border-emerald-300 bg-emerald-500/20');
    expect(getArmClassName('rejected')).toBe('border-white/10 bg-white/5 opacity-60');
  });

  it('pins the widget aria-label and reveal delay', () => {
    expect(MAZE_ARIA_LABEL).toBe(
      'Toxoplasma gondii Y-maze odor choice task. Predict which arm the rodent enters, then see the result explained.'
    );
    expect(ROUND_REVEAL_DELAY_MS).toBe(900);
  });
});
