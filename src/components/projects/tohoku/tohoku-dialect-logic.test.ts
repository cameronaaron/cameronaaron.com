import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

import {
  DIALECT_ARIA_LABEL,
  DIALECT_ITEMS,
  INITIAL_ROUND_SEED,
  INITIAL_SCORE_STATE,
  OPTIONS_PER_ROUND,
  PRNG_WARMUP_DRAWS,
  RULE_PROFILES,
  checkAnswer,
  computeScoreUpdate,
  generateRound,
  getInitialRound,
  getOptionAriaLabel,
  getOptionClassName,
  getOptionVisualState,
  getRoundExplanation,
  getRoundResultMessage,
  rotateOptions,
} from './tohoku-dialect-logic';

describe('dialect catalog — the linguistics the game encodes', () => {
  it('ships a non-trivial catalog', () => {
    expect(DIALECT_ITEMS.length).toBeGreaterThanOrEqual(8);
  });

  it('never lists a Tohoku form identical to the Standard form', () => {
    for (const item of DIALECT_ITEMS) {
      expect(item.tohoku).not.toBe(item.standard);
    }
  });

  it('gives every item exactly two distractors, both distinct from the answer', () => {
    for (const item of DIALECT_ITEMS) {
      expect(item.distractors).toHaveLength(2);
      expect(item.distractors[0]).not.toBe(item.tohoku);
      expect(item.distractors[1]).not.toBe(item.tohoku);
      expect(item.distractors[0]).not.toBe(item.distractors[1]);
    }
  });

  it('covers all three sound changes', () => {
    const rules = new Set(DIALECT_ITEMS.map((item) => item.rule));
    expect(rules).toEqual(
      new Set(['intervocalic-voicing', 'velar-nasalization', 'vowel-centralization'])
    );
  });

  it('voices intervocalic k and t in every voicing item', () => {
    const voicing = DIALECT_ITEMS.filter((item) => item.rule === 'intervocalic-voicing');
    expect(voicing.length).toBeGreaterThan(0);
    for (const item of voicing) {
      // k -> g or t -> d, and nothing else about the word changes.
      const expected = item.standard.replace(/([aeiou])k([aeiou])/, '$1g$2').replace(/([aeiou])t([aeiou])/, '$1d$2');
      expect(item.tohoku).toBe(expected);
    }
  });

  it('turns intervocalic g into ng in every nasalization item', () => {
    const nasal = DIALECT_ITEMS.filter((item) => item.rule === 'velar-nasalization');
    expect(nasal.length).toBeGreaterThan(0);
    for (const item of nasal) {
      expect(item.tohoku).toBe(item.standard.replace(/([aeiou])g/, '$1ng'));
    }
  });

  it('centralizes both i and u in every centralization item', () => {
    const central = DIALECT_ITEMS.filter((item) => item.rule === 'vowel-centralization');
    expect(central.length).toBeGreaterThan(0);
    for (const item of central) {
      expect(item.tohoku).toContain('ɨ');
      expect(/[iu]/.test(item.tohoku)).toBe(false);
    }
  });

  it('encodes the push chain: kaki lands where kagi vacates', () => {
    // The single most interesting fact in the whole essay, so it is pinned:
    // if either half of the chain is edited away, this fails.
    const kaki = DIALECT_ITEMS.find((item) => item.standard === 'kaki');
    const kagi = DIALECT_ITEMS.find((item) => item.standard === 'kagi');

    expect(kaki?.tohoku).toBe('kagi');
    expect(kagi?.tohoku).toBe('kangi');
    // The contrast survives — the two outputs are still different words.
    expect(kaki?.tohoku).not.toBe(kagi?.tohoku);
    expect(kaki?.chainNote).toContain('push chain');
  });

  it('describes each rule in its profile', () => {
    expect(RULE_PROFILES['intervocalic-voicing'].label).toBe('Intervocalic voicing');
    expect(RULE_PROFILES['velar-nasalization'].label).toBe('Velar nasalization');
    expect(RULE_PROFILES['vowel-centralization'].label).toBe('Vowel centralization');
    expect(RULE_PROFILES['vowel-centralization'].summary).toContain('zūzū-ben');
  });
});

describe('DIALECT_ITEMS and RULE_PROFILES — exact content pin', () => {
  it('matches the whole catalog exactly, including kana/gloss/distractors/chainNote', () => {
    // `tohoku` and `standard` are already pinned indirectly by the
    // voicing/nasalization/centralization derivation tests above (each
    // re-derives `tohoku` from `standard` via the rule's own regex). kana,
    // gloss, distractors, and chainNote are pure display content with no
    // other logic touching them, so nothing else in this file would notice
    // one going blank — one exact fixture closes all of them at once, the
    // same move divergent-thinking-logic.ts's catalog pin made.
    expect(DIALECT_ITEMS).toEqual([
      {
        kana: '柿',
        standard: 'kaki',
        tohoku: 'kagi',
        gloss: 'persimmon',
        rule: 'intervocalic-voicing',
        distractors: ['kangi', 'kakɨ'],
        chainNote:
          'This is the push chain in action: kaki lands on kagi, and the word that already WAS kagi (鍵, “key”) moves on to kaŋi — so the two never collide.',
      },
      {
        kana: '鍵',
        standard: 'kagi',
        tohoku: 'kangi',
        gloss: 'key',
        rule: 'velar-nasalization',
        distractors: ['kagi', 'kagɨ'],
        chainNote:
          'The other half of the chain: this word vacates “kagi” precisely as 柿 kaki arrives there. A merger is avoided by both words moving at once.',
      },
      {
        kana: '的',
        standard: 'mato',
        tohoku: 'mado',
        gloss: 'target',
        rule: 'intervocalic-voicing',
        distractors: ['mango', 'matɨ'],
      },
      {
        kana: '鳩',
        standard: 'hato',
        tohoku: 'hado',
        gloss: 'pigeon',
        rule: 'intervocalic-voicing',
        distractors: ['hango', 'hatɨ'],
      },
      {
        kana: '鏡',
        standard: 'kagami',
        tohoku: 'kangami',
        gloss: 'mirror',
        rule: 'velar-nasalization',
        distractors: ['kakami', 'kagamɨ'],
      },
      {
        kana: '影',
        standard: 'kage',
        tohoku: 'kange',
        gloss: 'shadow',
        rule: 'velar-nasalization',
        distractors: ['kake', 'kagɨ'],
      },
      {
        kana: '寿司',
        standard: 'sushi',
        tohoku: 'sɨsɨ',
        gloss: 'sushi',
        rule: 'vowel-centralization',
        distractors: ['suzhi', 'sushe'],
        chainNote:
          'With both vowels centralized, 寿司 sushi and 煤 susu fall together as [sɨsɨ] — here the contrast really is lost, which is why this rule, not the voicing one, is what makes the dialect hard for other speakers.',
      },
      {
        kana: '月',
        standard: 'tsuki',
        tohoku: 'tsɨkɨ',
        gloss: 'moon',
        rule: 'vowel-centralization',
        distractors: ['tsugi', 'tsunki'],
      },
    ]);
  });

  it('pins both rule-profile summaries not already covered by the label/zūzū-ben checks', () => {
    expect(RULE_PROFILES['intervocalic-voicing'].summary).toBe(
      'A voiceless stop between vowels becomes voiced: k → g, t → d.'
    );
    expect(RULE_PROFILES['velar-nasalization'].summary).toBe(
      'An intervocalic g becomes the velar nasal ŋ (written “ng”).'
    );
  });
});

describe('rotateOptions', () => {
  it('returns the same order at offset 0', () => {
    expect(rotateOptions(['a', 'b', 'c'], 0)).toEqual(['a', 'b', 'c']);
  });

  it('rotates by one', () => {
    expect(rotateOptions(['a', 'b', 'c'], 1)).toEqual(['b', 'c', 'a']);
  });

  it('rotates by two', () => {
    expect(rotateOptions(['a', 'b', 'c'], 2)).toEqual(['c', 'a', 'b']);
  });

  it('wraps a full turn back to the original', () => {
    expect(rotateOptions(['a', 'b', 'c'], 3)).toEqual(['a', 'b', 'c']);
  });

  it('preserves every member exactly once', () => {
    const rotated = rotateOptions(['a', 'b', 'c'], 2);
    expect([...rotated].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('generateRound', () => {
  it('is deterministic for a fixed seed', () => {
    expect(generateRound(11)).toEqual(generateRound(11));
  });

  it('always includes the correct answer among the options', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const round = generateRound(seed);
      expect(round.options).toContain(round.item.tohoku);
    }
  });

  it('always offers exactly three distinct options', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const round = generateRound(seed);
      expect(round.options).toHaveLength(OPTIONS_PER_ROUND);
      expect(new Set(round.options).size).toBe(OPTIONS_PER_ROUND);
    }
  });

  it('does not park the answer in one slot every round', () => {
    // A rotation that never rotates would make the game trivially winnable.
    const slots = new Set<number>();
    for (let seed = 1; seed <= 300; seed += 1) {
      const round = generateRound(seed);
      slots.add(round.options.indexOf(round.item.tohoku));
    }
    expect(slots.size).toBeGreaterThan(1);
  });

  it('reaches more than one catalog item across a run', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 300; seed += 1) seen.add(generateRound(seed).item.standard);
    expect(seen.size).toBeGreaterThan(1);
  });

  it('consumes its PRNG draws in exactly the documented order', () => {
    const seed = 8080;
    const random = createSeededRandom(seed);
    for (let i = 0; i < PRNG_WARMUP_DRAWS; i += 1) random();
    const expectedItem = DIALECT_ITEMS[Math.floor(random() * DIALECT_ITEMS.length)];
    const expectedOffset = Math.floor(random() * OPTIONS_PER_ROUND);

    const round = generateRound(seed);
    expect(round.item).toEqual(expectedItem);
    expect(round.options).toEqual(
      rotateOptions([expectedItem.tohoku, expectedItem.distractors[0], expectedItem.distractors[1]], expectedOffset)
    );
  });

  it('warms the PRNG past the seed-correlated opening draws', () => {
    expect(PRNG_WARMUP_DRAWS).toBe(3);
    for (let seed = 1; seed <= 200; seed += 1) {
      expect(createSeededRandom(seed)()).toBeLessThan(0.5);
    }
  });

  it('getInitialRound uses the pinned hydration-safe seed', () => {
    expect(getInitialRound()).toEqual(generateRound(INITIAL_ROUND_SEED));
    expect(INITIAL_ROUND_SEED).toBe(30_011);
  });
});

describe('checkAnswer', () => {
  it('accepts only the real Tohoku form', () => {
    const round = generateRound(INITIAL_ROUND_SEED);
    expect(checkAnswer(round, round.item.tohoku)).toBe(true);
    expect(checkAnswer(round, round.item.distractors[0])).toBe(false);
    expect(checkAnswer(round, round.item.distractors[1])).toBe(false);
  });
});

describe('computeScoreUpdate', () => {
  it('adds a point and extends the streak when correct', () => {
    expect(computeScoreUpdate({ score: 1, streak: 1, bestStreak: 4 }, true)).toEqual({
      score: 2,
      streak: 2,
      bestStreak: 4,
    });
  });

  it('raises the best streak once the current streak passes it', () => {
    expect(computeScoreUpdate({ score: 3, streak: 3, bestStreak: 3 }, true)).toEqual({
      score: 4,
      streak: 4,
      bestStreak: 4,
    });
  });

  it('resets the streak but never subtracts score when wrong', () => {
    expect(computeScoreUpdate({ score: 6, streak: 5, bestStreak: 9 }, false)).toEqual({
      score: 6,
      streak: 0,
      bestStreak: 9,
    });
  });

  it('starts from an all-zero state', () => {
    expect(INITIAL_SCORE_STATE).toEqual({ score: 0, streak: 0, bestStreak: 0 });
  });
});

describe('explanations', () => {
  it('names the change, the gloss, and the rule', () => {
    const kaki = DIALECT_ITEMS.find((item) => item.standard === 'kaki')!;
    const text = getRoundExplanation(kaki);
    expect(text).toContain('kaki → kagi');
    expect(text).toContain('persimmon');
    expect(text).toContain('Intervocalic voicing');
  });

  it('appends the chain note only where the item has one', () => {
    const kaki = DIALECT_ITEMS.find((item) => item.standard === 'kaki')!;
    const hato = DIALECT_ITEMS.find((item) => item.standard === 'hato')!;
    expect(getRoundExplanation(kaki)).toContain('push chain');
    expect(getRoundExplanation(hato)).not.toContain('push chain');
  });

  it('prefixes an exact verdict', () => {
    const item = DIALECT_ITEMS[0];
    expect(getRoundResultMessage(item, true)).toBe(`Correct. ${getRoundExplanation(item)}`);
    expect(getRoundResultMessage(item, false)).toBe(`Not quite. ${getRoundExplanation(item)}`);
  });

  it('produces a substantial explanation for every catalog item', () => {
    for (const item of DIALECT_ITEMS) {
      expect(getRoundExplanation(item).length).toBeGreaterThan(40);
    }
  });
});

describe('labels and visual state', () => {
  it('names the candidate and the source word', () => {
    const item = DIALECT_ITEMS[0];
    expect(getOptionAriaLabel('kagi', item)).toBe('kagi — candidate Tohoku pronunciation of kaki');
  });

  it('leaves every option idle until an answer is chosen', () => {
    const round = generateRound(INITIAL_ROUND_SEED);
    for (const option of round.options) {
      expect(getOptionVisualState(option, round, null)).toBe('idle');
    }
  });

  it('always reveals the correct option, even when the player was wrong', () => {
    const round = generateRound(INITIAL_ROUND_SEED);
    const wrong = round.item.distractors[0];
    expect(getOptionVisualState(round.item.tohoku, round, wrong)).toBe('correct');
    expect(getOptionVisualState(wrong, round, wrong)).toBe('wrong');
  });

  it('dims the option that was neither correct nor chosen', () => {
    const round = generateRound(INITIAL_ROUND_SEED);
    const chosen = round.item.distractors[0];
    const other = round.item.distractors[1];
    expect(getOptionVisualState(other, round, chosen)).toBe('missed');
  });

  it('maps each visual state to a distinct exact class string', () => {
    expect(getOptionClassName('idle')).toBe('border-white/15 bg-white/5 hover:border-cyan-300/50');
    expect(getOptionClassName('correct')).toBe('border-emerald-300 bg-emerald-500/20');
    expect(getOptionClassName('wrong')).toBe('border-rose-300 bg-rose-500/20');
    expect(getOptionClassName('missed')).toBe('border-white/10 bg-white/5 opacity-60');
  });

  it('pins the widget aria-label', () => {
    expect(DIALECT_ARIA_LABEL).toBe(
      'Tohoku dialect pronunciation task. Pick the Tohoku realization of the Standard Japanese word shown, then see which sound change applied.'
    );
  });
});
