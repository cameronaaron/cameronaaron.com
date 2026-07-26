/**
 * "Build the Smartest Team" — a collective-intelligence team-builder paired
 * with the "Social Intelligence Effect on Team Dynamic" essay.
 *
 * The player picks four people from a pool and sees the group's collective
 * intelligence score, broken down by what actually drove it. The whole design
 * exists to make one counter-intuitive result feel inevitable rather than
 * merely stated:
 *
 *   Woolley, Chabris, Pentland, Hashmi & Malone (2010), "Evidence for a
 *   Collective Intelligence Factor in the Performance of Human Groups",
 *   Science 330:686-688.
 *
 * They found a general factor `c` for groups, analogous to individual `g`, and
 * — the surprise — it was NOT significantly predicted by the average member's
 * intelligence, nor by the single smartest member's. What predicted it was
 * (a) the average SOCIAL SENSITIVITY of members, measured with the Reading the
 * Mind in the Eyes test, and (b) EQUALITY of conversational turn-taking:
 * groups where a few people dominated the discussion scored markedly lower.
 *
 * So a player who stacks four brilliant, dominant talkers builds a measurably
 * worse team than one who balances the conversation — which is exactly the
 * mistake the model has to reproduce for the game to teach anything.
 *
 * All scoring lives here, never inline in the component (modularization
 * contract). Everything is pure: the candidate pool is a fixed catalog and no
 * randomness is involved, so the widget is trivially hydration-safe.
 */

export interface Candidate {
  id: string;
  name: string;
  role: string;
  /** Individual intelligence, normalized 0-1. Deliberately weak as a predictor. */
  individualIq: number;
  /** Reading-the-Mind-in-the-Eyes-style social sensitivity, normalized 0-1. */
  socialSensitivity: number;
  /** Relative share of talking this person tends to take. Not a virtue or a flaw on its own. */
  talkativeness: number;
}

/**
 * The pool is built so the naive strategy is available and losing: Priya,
 * Marcus and Dieter are the three highest-IQ candidates AND three of the four
 * most dominant talkers, so an all-star draft collapses turn-taking equality.
 */
export const CANDIDATE_POOL: readonly Candidate[] = [
  { id: 'priya', name: 'Priya', role: 'Systems architect', individualIq: 0.96, socialSensitivity: 0.28, talkativeness: 0.95 },
  { id: 'marcus', name: 'Marcus', role: 'Quant analyst', individualIq: 0.93, socialSensitivity: 0.22, talkativeness: 0.90 },
  { id: 'dieter', name: 'Dieter', role: 'Principal engineer', individualIq: 0.91, socialSensitivity: 0.31, talkativeness: 0.88 },
  { id: 'ana', name: 'Ana', role: 'Clinical researcher', individualIq: 0.74, socialSensitivity: 0.88, talkativeness: 0.52 },
  { id: 'ife', name: 'Ife', role: 'Design lead', individualIq: 0.71, socialSensitivity: 0.92, talkativeness: 0.48 },
  { id: 'toma', name: 'Toma', role: 'Field technician', individualIq: 0.62, socialSensitivity: 0.81, talkativeness: 0.50 },
  { id: 'saoirse', name: 'Saoirse', role: 'Ops coordinator', individualIq: 0.68, socialSensitivity: 0.85, talkativeness: 0.55 },
  { id: 'ken', name: 'Ken', role: 'Data steward', individualIq: 0.80, socialSensitivity: 0.44, talkativeness: 0.20 },
];

export const TEAM_SIZE = 4;

/**
 * Weights on the three inputs to `c`.
 *
 * These encode the paper's finding, not a guess at plausible numbers: average
 * member IQ was a weak, non-significant predictor, while social sensitivity
 * and turn-taking equality carried the effect. The IQ weight is deliberately
 * small rather than zero — the paper found it weak, not irrelevant, and
 * zeroing it would overstate the result in the other direction.
 */
export const IQ_WEIGHT = 0.1;
export const SENSITIVITY_WEIGHT = 0.5;
export const EQUALITY_WEIGHT = 0.4;

export interface TeamScore {
  /** Collective intelligence, 0-100. */
  collective: number;
  /** Mean individual IQ of the team, 0-1. */
  averageIq: number;
  /** Mean social sensitivity, 0-1. */
  averageSensitivity: number;
  /** Turn-taking equality, 0-1 — 1 means everyone speaks an equal share. */
  turnTakingEquality: number;
}

export function averageOf(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

/**
 * Turn-taking equality from each member's talkativeness.
 *
 * Talkativeness is normalized into shares of the conversation, then compared
 * against a perfectly even split. The deviation measure is total variation
 * distance — half the sum of absolute differences from the even share — which
 * is 0 for a perfectly balanced group and `1 - 1/n` when one person does all
 * the talking. Dividing by that maximum puts equality on a clean 0-1 scale
 * regardless of team size.
 */
export function computeTurnTakingEquality(talkativeness: readonly number[]): number {
  const size = talkativeness.length;
  if (size <= 1) return 1;

  let total = 0;
  for (const value of talkativeness) total += value;
  // Nobody talking at all is a degenerate input, not an inequality.
  if (total === 0) return 1;

  const evenShare = 1 / size;
  let deviation = 0;
  for (const value of talkativeness) {
    const share = value / total;
    deviation += Math.abs(share - evenShare);
  }
  deviation /= 2;

  return 1 - deviation / (1 - evenShare);
}

/** Score a team. Constant work: the team is always TEAM_SIZE members. */
export function scoreTeam(team: readonly Candidate[]): TeamScore {
  const averageIq = averageOf(team.map((member) => member.individualIq));
  const averageSensitivity = averageOf(team.map((member) => member.socialSensitivity));
  const turnTakingEquality = computeTurnTakingEquality(team.map((member) => member.talkativeness));

  const collective =
    (IQ_WEIGHT * averageIq + SENSITIVITY_WEIGHT * averageSensitivity + EQUALITY_WEIGHT * turnTakingEquality) * 100;

  return { collective, averageIq, averageSensitivity, turnTakingEquality };
}

/** Toggle a candidate in or out of the selection, respecting the team-size cap. */
export function toggleSelection(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) {
    return selected.filter((selectedId) => selectedId !== id);
  }
  if (selected.length >= TEAM_SIZE) return [...selected];
  return [...selected, id];
}

export function getCandidateById(id: string): Candidate | undefined {
  return CANDIDATE_POOL.find((candidate) => candidate.id === id);
}

/** Resolve selected ids to candidates, skipping any id not in the pool. */
export function resolveTeam(selected: readonly string[]): Candidate[] {
  const team: Candidate[] = [];
  for (const id of selected) {
    const candidate = getCandidateById(id);
    if (candidate) team.push(candidate);
  }
  return team;
}

export function isTeamComplete(selected: readonly string[]): boolean {
  return selected.length === TEAM_SIZE;
}

/**
 * The four highest individual-IQ candidates — the tempting, wrong answer.
 *
 * Stored as a constant rather than computed: production has no reason to sort
 * a fixed catalog at runtime, and the companion test derives the same list
 * independently and fails if the pool is ever edited out from under it.
 */
export const HIGHEST_IQ_TEAM_IDS: readonly string[] = ['priya', 'marcus', 'dieter', 'ken'];

/**
 * The best team the pool allows.
 *
 * Also a constant, for the same reason and one more: finding it means scoring
 * all 8-choose-4 = 70 combinations, and a four-deep search loop has no place
 * in a render path (ENGINEERING-STANDARDS §1 — linear-and-worse work runs
 * exactly once, and here it need not run at runtime at all). The exhaustive
 * search lives in the test, which proves this constant really is optimal and
 * would fail the moment a weight or a candidate changed.
 *
 * Measured over the shipped pool: this team scores 88.95, while
 * HIGHEST_IQ_TEAM_IDS scores 54.93 — the WORST of all 70 possible teams. That
 * gap is the entire lesson, and it is pinned by test.
 */
export const OPTIMAL_TEAM_IDS: readonly string[] = ['ana', 'ife', 'toma', 'saoirse'];

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * The verdict copy. Each branch names WHICH input decided the outcome, so the
 * player can see that a high-IQ team lost on turn-taking rather than being
 * told it in the abstract.
 */
export function getTeamVerdict(score: TeamScore): string {
  if (score.turnTakingEquality < 0.75) {
    return `Conversation is lopsided (${formatPercent(
      score.turnTakingEquality
    )} equality) — a few people are doing most of the talking. In Woolley et al. that pattern predicted LOWER collective intelligence regardless of how capable the individuals were.`;
  }

  if (score.averageSensitivity < 0.5) {
    return `Turn-taking is balanced, but average social sensitivity is low (${formatPercent(
      score.averageSensitivity
    )}). Social sensitivity was the strongest single predictor of collective intelligence in the study — stronger than anyone's individual score.`;
  }

  if (score.collective >= 80) {
    return `Strong group: balanced turn-taking (${formatPercent(
      score.turnTakingEquality
    )}) and high social sensitivity (${formatPercent(
      score.averageSensitivity
    )}). Note this team is NOT the highest-IQ team available — that is the whole finding.`;
  }

  return `Reasonable group. Collective intelligence tracks social sensitivity and equal turn-taking far more than raw individual ability — try trading a dominant talker for a more socially sensitive member.`;
}

export const TEAM_BUILDER_ARIA_LABEL =
  'Collective intelligence team builder. Select four people and see the group score, with a breakdown of what drove it.';
