import { describe, expect, it } from 'vitest';

import {
  CANDIDATE_POOL,
  EQUALITY_WEIGHT,
  HIGHEST_IQ_TEAM_IDS,
  IQ_WEIGHT,
  OPTIMAL_TEAM_IDS,
  SENSITIVITY_WEIGHT,
  TEAM_BUILDER_ARIA_LABEL,
  TEAM_SIZE,
  averageOf,
  computeTurnTakingEquality,
  formatPercent,
  formatScore,
  getCandidateById,
  getTeamVerdict,
  isTeamComplete,
  resolveTeam,
  scoreTeam,
  toggleSelection,
  type Candidate,
} from './collective-intelligence-logic';

/** Every 4-member combination of the pool, scored. Fixed 8-choose-4 = 70. */
function allTeams(): Array<{ ids: string[]; score: number }> {
  const out: Array<{ ids: string[]; score: number }> = [];
  const size = CANDIDATE_POOL.length;
  for (let a = 0; a < size; a += 1) {
    for (let b = a + 1; b < size; b += 1) {
      for (let c = b + 1; c < size; c += 1) {
        for (let d = c + 1; d < size; d += 1) {
          const team = [CANDIDATE_POOL[a], CANDIDATE_POOL[b], CANDIDATE_POOL[c], CANDIDATE_POOL[d]];
          out.push({ ids: team.map((m) => m.id), score: scoreTeam(team).collective });
        }
      }
    }
  }
  return out;
}

describe('the finding the game exists to teach', () => {
  it('scores the highest-IQ team WORSE than the optimal team', () => {
    const optimal = scoreTeam(resolveTeam(OPTIMAL_TEAM_IDS)).collective;
    const allStars = scoreTeam(resolveTeam(HIGHEST_IQ_TEAM_IDS)).collective;
    expect(allStars).toBeLessThan(optimal);
  });

  it('makes the all-star IQ draft the single worst team in the pool', () => {
    // Not merely "not best" — dead last of all 70. If a future edit to the
    // pool or the weights softens this, the game stops teaching anything and
    // this fails loudly.
    const teams = allTeams();
    const worst = teams.reduce((lowest, team) => (team.score < lowest.score ? team : lowest));
    expect([...worst.ids].sort()).toEqual([...HIGHEST_IQ_TEAM_IDS].sort());
  });

  it('confirms OPTIMAL_TEAM_IDS really is optimal, by exhaustive search', () => {
    const teams = allTeams();
    const best = teams.reduce((highest, team) => (team.score > highest.score ? team : highest));
    expect([...best.ids].sort()).toEqual([...OPTIMAL_TEAM_IDS].sort());
  });

  it('confirms HIGHEST_IQ_TEAM_IDS really is the four highest-IQ candidates', () => {
    const derived = [...CANDIDATE_POOL]
      .sort((a, b) => b.individualIq - a.individualIq)
      .slice(0, TEAM_SIZE)
      .map((member) => member.id);
    expect([...derived].sort()).toEqual([...HIGHEST_IQ_TEAM_IDS].sort());
  });

  it('weights social sensitivity and equality far above individual IQ', () => {
    expect(SENSITIVITY_WEIGHT).toBeGreaterThan(IQ_WEIGHT);
    expect(EQUALITY_WEIGHT).toBeGreaterThan(IQ_WEIGHT);
    expect(IQ_WEIGHT + SENSITIVITY_WEIGHT + EQUALITY_WEIGHT).toBeCloseTo(1, 12);
  });

  it('keeps the IQ weight non-zero — the study found it weak, not absent', () => {
    expect(IQ_WEIGHT).toBeGreaterThan(0);
  });
});

describe('candidate pool', () => {
  it('offers strictly more candidates than a team needs', () => {
    expect(CANDIDATE_POOL.length).toBeGreaterThan(TEAM_SIZE);
  });

  it('matches every candidate exactly — id, name, role, and all three traits', () => {
    // name/role are load-bearing display content (rendered directly on each
    // candidate's card), not cosmetic — a mutated name would ship blank text.
    // One exact fixture closes every name/role string-literal mutant at once,
    // the same move divergent-thinking-logic.ts's and tohoku's catalog pins
    // made. Traits are already exact-value pinned by the "naive strategy"
    // and "all-star" tests above/below; included here for one complete
    // round-trip against the real export.
    expect(CANDIDATE_POOL).toEqual([
      { id: 'priya', name: 'Priya', role: 'Systems architect', individualIq: 0.96, socialSensitivity: 0.28, talkativeness: 0.95 },
      { id: 'marcus', name: 'Marcus', role: 'Quant analyst', individualIq: 0.93, socialSensitivity: 0.22, talkativeness: 0.90 },
      { id: 'dieter', name: 'Dieter', role: 'Principal engineer', individualIq: 0.91, socialSensitivity: 0.31, talkativeness: 0.88 },
      { id: 'ana', name: 'Ana', role: 'Clinical researcher', individualIq: 0.74, socialSensitivity: 0.88, talkativeness: 0.52 },
      { id: 'ife', name: 'Ife', role: 'Design lead', individualIq: 0.71, socialSensitivity: 0.92, talkativeness: 0.48 },
      { id: 'toma', name: 'Toma', role: 'Field technician', individualIq: 0.62, socialSensitivity: 0.81, talkativeness: 0.50 },
      { id: 'saoirse', name: 'Saoirse', role: 'Ops coordinator', individualIq: 0.68, socialSensitivity: 0.85, talkativeness: 0.55 },
      { id: 'ken', name: 'Ken', role: 'Data steward', individualIq: 0.80, socialSensitivity: 0.44, talkativeness: 0.20 },
    ]);
  });

  it('gives every candidate a unique id', () => {
    expect(new Set(CANDIDATE_POOL.map((c) => c.id)).size).toBe(CANDIDATE_POOL.length);
  });

  it('keeps every trait inside its normalized 0-1 range', () => {
    for (const candidate of CANDIDATE_POOL) {
      for (const trait of [candidate.individualIq, candidate.socialSensitivity, candidate.talkativeness]) {
        expect(trait).toBeGreaterThanOrEqual(0);
        expect(trait).toBeLessThanOrEqual(1);
      }
    }
  });

  it('makes the naive strategy genuinely tempting — top IQ also dominates conversation', () => {
    // Without this the trap would not be a trap: the player has to be able to
    // pick "obviously strong" people and be wrong for the right reason.
    for (const id of ['priya', 'marcus', 'dieter']) {
      const candidate = getCandidateById(id)!;
      expect(candidate.individualIq).toBeGreaterThan(0.85);
      expect(candidate.talkativeness).toBeGreaterThan(0.85);
      expect(candidate.socialSensitivity).toBeLessThan(0.4);
    }
  });
});

describe('averageOf', () => {
  it('averages a list exactly', () => {
    expect(averageOf([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns 0 for an empty list rather than NaN', () => {
    expect(averageOf([])).toBe(0);
  });

  it('handles a single value', () => {
    expect(averageOf([0.75])).toBe(0.75);
  });
});

describe('computeTurnTakingEquality', () => {
  it('is exactly 1 when everyone talks the same amount', () => {
    expect(computeTurnTakingEquality([0.5, 0.5, 0.5, 0.5])).toBeCloseTo(1, 12);
    expect(computeTurnTakingEquality([0.9, 0.9, 0.9, 0.9])).toBeCloseTo(1, 12);
  });

  it('is exactly 0 when one person does all the talking', () => {
    expect(computeTurnTakingEquality([1, 0, 0, 0])).toBeCloseTo(0, 12);
  });

  it('sits between the extremes for a partly lopsided group', () => {
    const value = computeTurnTakingEquality([0.9, 0.5, 0.5, 0.1]);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(1);
  });

  it('depends only on relative shares, not absolute volume', () => {
    // Doubling everyone's talkativeness cannot change how EQUAL the group is.
    const quiet = computeTurnTakingEquality([0.2, 0.3, 0.4, 0.1]);
    const loud = computeTurnTakingEquality([0.4, 0.6, 0.8, 0.2]);
    expect(quiet).toBeCloseTo(loud, 12);
  });

  it('treats a silent group as equal rather than dividing by zero', () => {
    expect(computeTurnTakingEquality([0, 0, 0, 0])).toBe(1);
  });

  it('treats a single member as trivially equal', () => {
    expect(computeTurnTakingEquality([0.7])).toBe(1);
    expect(computeTurnTakingEquality([])).toBe(1);
  });

  it('ranks a balanced group above a dominated one', () => {
    expect(computeTurnTakingEquality([0.5, 0.5, 0.5, 0.5])).toBeGreaterThan(
      computeTurnTakingEquality([0.95, 0.9, 0.88, 0.2])
    );
  });
});

describe('scoreTeam', () => {
  const team: Candidate[] = [
    { id: 'x', name: 'X', role: 'r', individualIq: 0.5, socialSensitivity: 0.5, talkativeness: 0.5 },
    { id: 'y', name: 'Y', role: 'r', individualIq: 0.5, socialSensitivity: 0.5, talkativeness: 0.5 },
  ];

  it('computes the weighted sum exactly', () => {
    // averages 0.5 / 0.5, equality 1 -> (0.1*0.5 + 0.5*0.5 + 0.4*1) * 100 = 70
    expect(scoreTeam(team).collective).toBeCloseTo(70, 10);
  });

  it('reports each component alongside the total', () => {
    const score = scoreTeam(team);
    expect(score.averageIq).toBeCloseTo(0.5, 12);
    expect(score.averageSensitivity).toBeCloseTo(0.5, 12);
    expect(score.turnTakingEquality).toBeCloseTo(1, 12);
  });

  it('rises when social sensitivity rises, holding everything else fixed', () => {
    const better = team.map((m) => ({ ...m, socialSensitivity: 0.9 }));
    expect(scoreTeam(better).collective).toBeGreaterThan(scoreTeam(team).collective);
  });

  it('falls when turn-taking becomes lopsided, holding everything else fixed', () => {
    const lopsided = [
      { ...team[0], talkativeness: 1 },
      { ...team[1], talkativeness: 0 },
    ];
    expect(scoreTeam(lopsided).collective).toBeLessThan(scoreTeam(team).collective);
  });
});

describe('toggleSelection', () => {
  it('adds an unselected candidate', () => {
    expect(toggleSelection(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes an already-selected candidate', () => {
    expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('refuses to exceed the team size', () => {
    const full = ['a', 'b', 'c', 'd'];
    expect(toggleSelection(full, 'e')).toEqual(full);
  });

  it('still allows DESELECTING when the team is full', () => {
    expect(toggleSelection(['a', 'b', 'c', 'd'], 'c')).toEqual(['a', 'b', 'd']);
  });

  it('never mutates the input array', () => {
    const input = ['a', 'b'];
    toggleSelection(input, 'c');
    expect(input).toEqual(['a', 'b']);
  });
});

describe('resolveTeam / helpers', () => {
  it('resolves ids to candidates in order', () => {
    expect(resolveTeam(['ana', 'ife']).map((c) => c.id)).toEqual(['ana', 'ife']);
  });

  it('skips ids that are not in the pool', () => {
    expect(resolveTeam(['ana', 'nobody']).map((c) => c.id)).toEqual(['ana']);
  });

  it('returns undefined for an unknown id', () => {
    expect(getCandidateById('nobody')).toBeUndefined();
  });

  it('is complete only at exactly the team size', () => {
    expect(isTeamComplete(['a', 'b', 'c'])).toBe(false);
    expect(isTeamComplete(['a', 'b', 'c', 'd'])).toBe(true);
    expect(TEAM_SIZE).toBe(4);
  });
});

describe('formatting and verdicts', () => {
  it('formats a score to one decimal', () => {
    expect(formatScore(88.949)).toBe('88.9');
    expect(formatScore(70)).toBe('70.0');
  });

  it('formats a proportion as a whole percent', () => {
    expect(formatPercent(0.884)).toBe('88%');
    expect(formatPercent(1)).toBe('100%');
  });

  it('blames lopsided turn-taking when one voice dominates outright', () => {
    const verdict = getTeamVerdict({
      collective: 55,
      averageIq: 0.9,
      averageSensitivity: 0.8,
      turnTakingEquality: 0.4,
    });
    expect(verdict).toContain('lopsided');
    expect(verdict).toContain('LOWER collective intelligence');
  });

  it('blames social sensitivity for the all-star IQ team, which is its real shortfall', () => {
    // Worth pinning which factor the model actually indicts: this team's
    // turn-taking equality is 0.76 (three dominant talkers plus one near-silent
    // member), only marginally below par, while its average social sensitivity
    // is 0.31 — far below. Asserting 'lopsided' here would have been asserting
    // a plausible story rather than the computed one.
    const score = scoreTeam(resolveTeam(HIGHEST_IQ_TEAM_IDS));
    expect(score.turnTakingEquality).toBeCloseTo(0.758, 2);
    expect(score.averageSensitivity).toBeCloseTo(0.3125, 4);
    expect(getTeamVerdict(score)).toContain('social sensitivity is low');
  });

  it('blames low social sensitivity when turn-taking is fine but sensitivity is not', () => {
    const verdict = getTeamVerdict({
      collective: 60,
      averageIq: 0.9,
      averageSensitivity: 0.3,
      turnTakingEquality: 0.95,
    });
    expect(verdict).toContain('social sensitivity is low');
  });

  it('calls out that the best team is not the highest-IQ team', () => {
    const verdict = getTeamVerdict(scoreTeam(resolveTeam(OPTIMAL_TEAM_IDS)));
    expect(verdict).toContain('NOT the highest-IQ team');
  });

  it('treats exactly 0.75 turn-taking equality as NOT lopsided (exclusive boundary)', () => {
    // At exactly 0.75, real code falls through to the sensitivity check — a
    // '<=' mutant would misclassify a borderline-but-acceptable team as
    // "lopsided" instead. Direct TeamScore construction reaches the exact
    // boundary the real candidate pool's discrete team combinations can't.
    const verdict = getTeamVerdict({ collective: 50, averageIq: 0.5, averageSensitivity: 0.3, turnTakingEquality: 0.75 });
    expect(verdict).not.toContain('lopsided');
    expect(verdict).toContain('social sensitivity is low');
  });

  it('treats exactly 0.5 average sensitivity as NOT low (exclusive boundary)', () => {
    const verdict = getTeamVerdict({ collective: 60, averageIq: 0.5, averageSensitivity: 0.5, turnTakingEquality: 0.9 });
    expect(verdict).not.toContain('social sensitivity is low');
  });

  it('treats exactly 80 collective intelligence as ALREADY strong (inclusive boundary)', () => {
    // `>= 80`, not `> 80`: a team scoring exactly 80 IS the strong-group
    // branch. A '>' mutant would push it into the generic fallback instead.
    const verdict = getTeamVerdict({ collective: 80, averageIq: 0.5, averageSensitivity: 0.9, turnTakingEquality: 0.95 });
    expect(verdict).toContain('Strong group');
  });

  it('gives an actionable nudge for a middling team', () => {
    const verdict = getTeamVerdict({
      collective: 72,
      averageIq: 0.7,
      averageSensitivity: 0.6,
      turnTakingEquality: 0.9,
    });
    expect(verdict).toContain('trading a dominant talker');
  });

  it('pins the widget aria-label', () => {
    expect(TEAM_BUILDER_ARIA_LABEL).toBe(
      'Collective intelligence team builder. Select four people and see the group score, with a breakdown of what drove it.'
    );
  });
});
