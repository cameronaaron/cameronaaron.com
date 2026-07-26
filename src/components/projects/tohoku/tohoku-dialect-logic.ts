import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

/**
 * "Hear the Shift" — a Tohoku-dialect phonology task paired with the
 * "Differences Between Standard Japanese & Tohoku Dialects" essay.
 *
 * The player sees a Standard Japanese word and picks its Tohoku realization
 * from three candidates. The distractors are not random noise: each one is the
 * result of applying a DIFFERENT real Tohoku rule to the same word, so the
 * only way to answer reliably is to learn which rule the word's shape actually
 * triggers. Three rules are in play:
 *
 *  1. INTERVOCALIC VOICING — voiceless stops between vowels become voiced:
 *     /k/ → [g], /t/ → [d].  kaki → kagi,  mato → mado.
 *  2. VELAR NASALIZATION — intervocalic /g/ becomes the velar nasal [ŋ],
 *     written here as "ng".  kagami → kangami.
 *  3. VOWEL CENTRALIZATION — /i/ and /u/ both centralize toward [ɨ], which
 *     collapses the shi/su and chi/tsu contrasts. This is the feature the
 *     dialect is nicknamed for: zūzū-ben (ズーズー弁).
 *
 * The payload worth building a game around is what rules 1 and 2 do TOGETHER.
 * Taken alone, voicing /k/ → [g] looks like it should merge 柿 kaki
 * "persimmon" with 鍵 kagi "key". It doesn't, because the same dialect moves
 * original /g/ onward to [ŋ] at the same time: kaki → [kagi] while kagi →
 * [kaŋi]. The contrast survives — it has just rotated one step. That is a
 * textbook PUSH CHAIN, and it is the reason a sound change can look
 * destructive and still leave a language perfectly able to distinguish its
 * words.
 *
 * Content catalog and all round logic live here, never inline in the component
 * (modularization contract). Rounds are a pure function of a seed via the
 * shared PRNG so the first round is identical on the server and the client's
 * first paint (CLAUDE.md #10).
 */

export type PhonologicalRule = 'intervocalic-voicing' | 'velar-nasalization' | 'vowel-centralization';

export interface RuleProfile {
  label: string;
  summary: string;
}

export const RULE_PROFILES: Record<PhonologicalRule, RuleProfile> = {
  'intervocalic-voicing': {
    label: 'Intervocalic voicing',
    summary: 'A voiceless stop between vowels becomes voiced: k → g, t → d.',
  },
  'velar-nasalization': {
    label: 'Velar nasalization',
    summary: 'An intervocalic g becomes the velar nasal ŋ (written “ng”).',
  },
  'vowel-centralization': {
    label: 'Vowel centralization',
    summary: 'i and u both centralize toward ɨ, collapsing shi/su and chi/tsu — the zūzū-ben hallmark.',
  },
};

export interface DialectItem {
  /** The word in kana, for readers who want it. */
  kana: string;
  /** Standard Japanese pronunciation, romanized. */
  standard: string;
  /** Tohoku realization, romanized. */
  tohoku: string;
  gloss: string;
  rule: PhonologicalRule;
  /** Two wrong realizations, each produced by applying a different real rule. */
  distractors: readonly [string, string];
  /** Extra note appended to the explanation when this item illustrates the chain shift. */
  chainNote?: string;
}

/**
 * The word catalog. Every entry is a real Standard→Tohoku correspondence, and
 * every distractor is what the word WOULD become under one of the other two
 * rules — never an invented non-word.
 */
export const DIALECT_ITEMS: readonly DialectItem[] = [
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
];

/** Fixed seed for the first round — identical on server and client first paint. */
export const INITIAL_ROUND_SEED = 30_011;

/**
 * Draws discarded before reading a meaningful value. The shared
 * `createSeededRandom` is an LCG whose first output is nearly linear in a
 * small seed (every seed below ~2500 yields 0.236–0.314), so an early draw is
 * not uniform. Same warm-up, same reason, as the Toxoplasma maze — see its
 * PRNG_WARMUP_DRAWS for the measurement that established this.
 */
export const PRNG_WARMUP_DRAWS = 3;

export const OPTIONS_PER_ROUND = 3;

export interface DialectRound {
  item: DialectItem;
  /** The three candidate realizations, in the order they should be shown. */
  options: readonly string[];
}

export interface ScoreState {
  score: number;
  streak: number;
  bestStreak: number;
}

export const INITIAL_SCORE_STATE: ScoreState = { score: 0, streak: 0, bestStreak: 0 };

/**
 * Rotate the three candidates by a seeded offset so the correct answer is not
 * always in the same slot. A rotation rather than a shuffle on purpose: it
 * touches every position with one draw, allocates one array, and is trivially
 * exact-value testable — a shuffle would need either more draws or a
 * rejection loop for no gameplay benefit.
 */
export function rotateOptions(options: readonly string[], offset: number): string[] {
  const size = options.length;
  const rotated: string[] = [];
  for (let i = 0; i < size; i += 1) {
    rotated.push(options[(i + offset) % size]);
  }
  return rotated;
}

/** Generate one deterministic round from a seed. */
export function generateRound(seed: number): DialectRound {
  const random = createSeededRandom(seed);
  for (let i = 0; i < PRNG_WARMUP_DRAWS; i += 1) random();

  const item = DIALECT_ITEMS[Math.floor(random() * DIALECT_ITEMS.length)];
  const offset = Math.floor(random() * OPTIONS_PER_ROUND);
  const options = rotateOptions([item.tohoku, item.distractors[0], item.distractors[1]], offset);

  return { item, options };
}

/** The deterministic first round, passed to useState by reference. */
export function getInitialRound(): DialectRound {
  return generateRound(INITIAL_ROUND_SEED);
}

export function checkAnswer(round: DialectRound, chosen: string): boolean {
  return chosen === round.item.tohoku;
}

/** Correct answers add a point and extend the streak; wrong ones only reset the streak. */
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

/** The teaching text for a resolved round: the rule, then the chain note if any. */
export function getRoundExplanation(item: DialectItem): string {
  const profile = RULE_PROFILES[item.rule];
  const base = `${item.standard} → ${item.tohoku} (${item.gloss}). ${profile.label}: ${profile.summary}`;
  return item.chainNote ? `${base} ${item.chainNote}` : base;
}

export function getRoundResultMessage(item: DialectItem, correct: boolean): string {
  return `${correct ? 'Correct.' : 'Not quite.'} ${getRoundExplanation(item)}`;
}

export function getOptionAriaLabel(option: string, item: DialectItem): string {
  return `${option} — candidate Tohoku pronunciation of ${item.standard}`;
}

const OPTION_STATE_CLASSES = {
  idle: 'border-white/15 bg-white/5 hover:border-cyan-300/50',
  correct: 'border-emerald-300 bg-emerald-500/20',
  wrong: 'border-rose-300 bg-rose-500/20',
  missed: 'border-white/10 bg-white/5 opacity-60',
} as const;

export type OptionVisualState = keyof typeof OPTION_STATE_CLASSES;

/**
 * Visual state for one option once the round resolves: the right answer is
 * always shown as correct, the player's wrong pick is marked, and everything
 * else dims.
 */
export function getOptionVisualState(
  option: string,
  round: DialectRound,
  chosen: string | null
): OptionVisualState {
  if (chosen === null) return 'idle';
  if (option === round.item.tohoku) return 'correct';
  if (option === chosen) return 'wrong';
  return 'missed';
}

export function getOptionClassName(state: OptionVisualState): string {
  return OPTION_STATE_CLASSES[state];
}

export const DIALECT_ARIA_LABEL =
  'Tohoku dialect pronunciation task. Pick the Tohoku realization of the Standard Japanese word shown, then see which sound change applied.';
