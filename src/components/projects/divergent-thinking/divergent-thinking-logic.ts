/**
 * "Unusual Uses" — a divergent-thinking task paired with the "Creating the
 * Perfect Fit: Turning ADD Into an Asset" essay.
 *
 * This is Guilford's Alternative Uses Task, the standard instrument for
 * divergent thinking: given an everyday object, produce as many uses for it as
 * you can. The version here is selection-based rather than free text so it can
 * be scored honestly offline, but it keeps the part that matters — how the
 * task is actually SCORED.
 *
 * Divergent thinking is not scored on how many answers you give. The
 * dimensions are:
 *
 *   FLUENCY     — how many responses.
 *   FLEXIBILITY — how many distinct semantic CATEGORIES those responses span.
 *   ORIGINALITY — how statistically uncommon they are.
 *
 * Fluency is the one people assume is the whole test, and it is the weakest
 * signal. Five uses for a brick that are all "hit something with it" is five
 * fluency points and ONE flexibility point. That distinction is the entire
 * lesson of this widget: a player who clicks everything conventional scores
 * badly, and learns why by seeing the breakdown.
 *
 * The link to the essay's subject is a real and deliberately two-sided
 * literature. Adults with ADHD score higher on divergent-thinking measures and
 * report more real-world creative achievement (White & Shah, 2006,
 * "Uninhibited imaginations: creativity in adults with ADHD", Personality and
 * Individual Differences 40:1121-1131; and White & Shah, 2011). The proposed
 * mechanism is reduced cognitive inhibition — the same trait that makes
 * sustained, rule-bound focus harder makes leaving a semantic category easier.
 * The honest framing is a trade-off, not a superpower: the same work finds a
 * preference for idea GENERATION over the convergent refinement that turns an
 * idea into a finished thing.
 *
 * Catalog and scoring live here (modularization contract). Nothing is random,
 * so the widget is hydration-safe by construction.
 */

export type UseCategory =
  | 'construction'
  | 'weight'
  | 'tool'
  | 'art'
  | 'measurement'
  | 'destruction'
  | 'comfort';

export interface CategoryProfile {
  label: string;
}

export const CATEGORY_PROFILES: Record<UseCategory, CategoryProfile> = {
  construction: { label: 'Construction' },
  weight: { label: 'Weight / ballast' },
  tool: { label: 'Tool' },
  art: { label: 'Art & expression' },
  measurement: { label: 'Measurement' },
  destruction: { label: 'Force & destruction' },
  comfort: { label: 'Comfort & care' },
};

export interface AlternativeUse {
  id: string;
  label: string;
  category: UseCategory;
  /**
   * True for the responses most people give first. Conventional uses still
   * earn fluency — they are not wrong — but they earn no originality.
   */
  conventional: boolean;
}

export interface UseObject {
  id: string;
  name: string;
  uses: readonly AlternativeUse[];
}

/**
 * The object catalog. Each object offers uses spanning several categories,
 * with the conventional answers deliberately clustered into one or two of
 * them — so a player who picks only the obvious uses lands high fluency and
 * low flexibility, which is the trap the scoring exists to expose.
 */
export const USE_OBJECTS: readonly UseObject[] = [
  {
    id: 'brick',
    name: 'a brick',
    uses: [
      { id: 'wall', label: 'Build a wall', category: 'construction', conventional: true },
      { id: 'path', label: 'Lay a garden path', category: 'construction', conventional: true },
      { id: 'doorstop', label: 'Hold a door open', category: 'weight', conventional: true },
      { id: 'anchor', label: 'Anchor a tarpaulin in wind', category: 'weight', conventional: false },
      { id: 'hammer', label: 'Drive a tent peg', category: 'tool', conventional: false },
      { id: 'sharpen', label: 'Sharpen a blade on it', category: 'tool', conventional: false },
      { id: 'chalk', label: 'Draw on pavement with it', category: 'art', conventional: false },
      { id: 'stamp', label: 'Press texture into wet clay', category: 'art', conventional: false },
      { id: 'ruler', label: 'Use as a standard length', category: 'measurement', conventional: false },
      { id: 'plumb', label: 'Swing it as a plumb bob', category: 'measurement', conventional: false },
      { id: 'smash', label: 'Break a window in an emergency', category: 'destruction', conventional: true },
      { id: 'warm', label: 'Heat it and warm a bed', category: 'comfort', conventional: false },
    ],
  },
  {
    id: 'paperclip',
    name: 'a paperclip',
    uses: [
      { id: 'clip', label: 'Hold papers together', category: 'construction', conventional: true },
      { id: 'chain', label: 'Link into a chain', category: 'construction', conventional: true },
      { id: 'reset', label: 'Press a recessed reset button', category: 'tool', conventional: true },
      { id: 'lockpick', label: 'Pick a simple lock', category: 'tool', conventional: false },
      { id: 'hook', label: 'Fish a dropped ring from a drain', category: 'tool', conventional: false },
      { id: 'sculpt', label: 'Bend into a tiny sculpture', category: 'art', conventional: false },
      { id: 'stencil', label: 'Scratch a stencil line', category: 'art', conventional: false },
      { id: 'zip', label: 'Replace a broken zip pull', category: 'comfort', conventional: false },
      { id: 'splint', label: 'Splint a snapped plant stem', category: 'comfort', conventional: false },
      { id: 'gauge', label: 'Gauge a narrow gap', category: 'measurement', conventional: false },
      { id: 'weight', label: 'Weigh down a hanging thread', category: 'weight', conventional: false },
      { id: 'scratch', label: 'Score a surface to break it', category: 'destruction', conventional: false },
    ],
  },
];

/** Points per distinct category — flexibility is the dimension that matters most. */
export const FLEXIBILITY_POINTS = 3;
/** Points per unconventional response — originality. */
export const ORIGINALITY_POINTS = 2;
/** Points per response regardless — fluency, deliberately the smallest weight. */
export const FLUENCY_POINTS = 1;

export interface DivergentScore {
  fluency: number;
  flexibility: number;
  originality: number;
  total: number;
}

/** Resolve selected use ids against an object, skipping anything unknown. */
export function resolveUses(object: UseObject, selected: readonly string[]): AlternativeUse[] {
  const resolved: AlternativeUse[] = [];
  for (const id of selected) {
    const use = object.uses.find((candidate) => candidate.id === id);
    if (use) resolved.push(use);
  }
  return resolved;
}

/**
 * Score a set of responses on all three real dimensions.
 *
 * Flexibility counts DISTINCT categories, which is why five responses from one
 * category score far below three responses from three.
 */
export function scoreResponses(uses: readonly AlternativeUse[]): DivergentScore {
  const categories = new Set<UseCategory>();
  let originality = 0;
  for (const use of uses) {
    categories.add(use.category);
    if (!use.conventional) originality += 1;
  }

  const fluency = uses.length;
  const flexibility = categories.size;

  return {
    fluency,
    flexibility,
    originality,
    // Stryker disable next-line ArithmeticOperator: FLUENCY_POINTS is fixed at
    // 1, and x*1 === x/1 for every finite x, so a '*' -> '/' mutant on this
    // term alone can never produce a different total. Hand-verified
    // 2026-07-26 per ENGINEERING-STANDARDS §6 item 13.
    total: fluency * FLUENCY_POINTS + flexibility * FLEXIBILITY_POINTS + originality * ORIGINALITY_POINTS,
  };
}

export function toggleUse(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((selectedId) => selectedId !== id);
  return [...selected, id];
}

/** Every distinct category an object can reach — the flexibility ceiling. */
export function getAvailableCategories(object: UseObject): UseCategory[] {
  const categories: UseCategory[] = [];
  for (const use of object.uses) {
    if (!categories.includes(use.category)) categories.push(use.category);
  }
  return categories;
}

/**
 * The feedback line. Each branch names which dimension the player is actually
 * short on, because "you scored 14" teaches nothing on its own.
 */
export function getScoreVerdict(score: DivergentScore, object: UseObject): string {
  if (score.fluency === 0) {
    return `Pick some uses for ${object.name}. There is no wrong answer here — the scoring cares about how far apart your ideas are, not how many you give.`;
  }

  const ceiling = getAvailableCategories(object).length;

  if (score.fluency >= 4 && score.flexibility <= 2) {
    return `${score.fluency} responses, but only ${score.flexibility} categor${
      score.flexibility === 1 ? 'y' : 'ies'
    }. That is fluency without flexibility — the classic pattern of staying inside one idea and rephrasing it. Try leaving the category entirely.`;
  }

  if (score.originality === 0) {
    return `All ${score.fluency} of your responses are the conventional ones. They count for fluency, but originality scores what most people DON'T say.`;
  }

  if (score.flexibility === ceiling) {
    return `Every one of the ${ceiling} available categories, with ${score.originality} unconventional response${
      score.originality === 1 ? '' : 's'
    }. That is what a high divergent-thinking profile looks like: not more answers, further-apart ones.`;
  }

  return `${score.flexibility} of ${ceiling} categories and ${score.originality} unconventional response${
    score.originality === 1 ? '' : 's'
  }. Reach for a category you have not touched — that is where flexibility points are.`;
}

export function formatScoreBreakdown(score: DivergentScore): string {
  return `Fluency ${score.fluency} · Flexibility ${score.flexibility} · Originality ${score.originality}`;
}

export const DIVERGENT_ARIA_LABEL =
  'Alternative uses task. Select uses for the object shown, then see your divergent thinking scored on fluency, flexibility and originality.';
