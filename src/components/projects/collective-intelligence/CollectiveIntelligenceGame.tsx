'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  CANDIDATE_POOL,
  HIGHEST_IQ_TEAM_IDS,
  TEAM_BUILDER_ARIA_LABEL,
  TEAM_SIZE,
  formatPercent,
  formatScore,
  getTeamVerdict,
  isTeamComplete,
  resolveTeam,
  scoreTeam,
  toggleSelection,
} from '@/components/projects/collective-intelligence/collective-intelligence-logic';

/**
 * "Build the Smartest Team" — the collective-intelligence team builder paired
 * with the "Social Intelligence Effect on Team Dynamic" essay. Pick four
 * people; the widget scores the group and names what drove the number.
 *
 * All scoring lives in ./collective-intelligence-logic (modularization
 * contract). There is no randomness anywhere, so the widget is hydration-safe
 * by construction, and no animation loop to gate. Every derived value is
 * `useMemo`'d per §3.4 — a collection build in a client component body is
 * never left bare.
 */
export default function CollectiveIntelligenceGame() {
  const [selected, setSelected] = useState<string[]>([]);

  const team = useMemo(() => resolveTeam(selected), [selected]);
  const score = useMemo(() => scoreTeam(team), [team]);
  const complete = isTeamComplete(selected);

  const handleToggle = useCallback((id: string) => {
    setSelected((current) => toggleSelection(current, id));
  }, []);

  const handleShowAllStars = useCallback(() => {
    setSelected([...HIGHEST_IQ_TEAM_IDS]);
  }, []);

  const handleReset = useCallback(() => {
    setSelected([]);
  }, []);

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="collective-intelligence-game"
      aria-label={TEAM_BUILDER_ARIA_LABEL}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Build the Smartest Team</h3>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Selected{' '}
          <strong data-testid="ci-count" className="text-cyan-300">
            {selected.length}/{TEAM_SIZE}
          </strong>
        </span>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        Pick four people. Groups have a measurable collective intelligence, and it is{' '}
        <em>not</em> predicted by how smart the members are individually — it tracks social sensitivity and how
        evenly the conversation is shared. Try the all-star lineup and see.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {CANDIDATE_POOL.map((candidate) => {
          const isSelected = selected.includes(candidate.id);
          const atCapacity = complete && !isSelected;
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => handleToggle(candidate.id)}
              disabled={atCapacity}
              aria-pressed={isSelected}
              data-testid={`ci-candidate-${candidate.id}`}
              className={`min-h-[44px] rounded-xl border p-4 text-left transition-colors disabled:opacity-40 ${
                isSelected ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/15 bg-white/5 hover:border-cyan-300/50'
              }`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-base font-semibold text-white">{candidate.name}</span>
                <span className="text-xs text-muted-foreground">{candidate.role}</span>
              </span>
              <span className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>
                  IQ <strong className="text-white/80">{formatPercent(candidate.individualIq)}</strong>
                </span>
                <span>
                  Social <strong className="text-white/80">{formatPercent(candidate.socialSensitivity)}</strong>
                </span>
                <span>
                  Talks <strong className="text-white/80">{formatPercent(candidate.talkativeness)}</strong>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleShowAllStars}
          data-testid="ci-allstars"
          className="min-h-[44px] rounded-full border border-amber-300/40 bg-amber-400/10 px-5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-400/20"
        >
          Draft the four highest IQs
        </button>
        <button
          type="button"
          onClick={handleReset}
          data-testid="ci-reset"
          className="min-h-[44px] rounded-full border border-white/20 bg-white/5 px-5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
        >
          Clear
        </button>
      </div>

      {complete ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5" data-testid="ci-result">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="text-sm uppercase tracking-[0.14em] text-muted-foreground">Collective intelligence</span>
            <strong data-testid="ci-score" className="font-display text-3xl text-cyan-300">
              {formatScore(score.collective)}
            </strong>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Avg individual IQ</dt>
              <dd className="mt-1 text-base text-white/80">{formatPercent(score.averageIq)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Avg social sensitivity</dt>
              <dd className="mt-1 text-base text-white/80">{formatPercent(score.averageSensitivity)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Turn-taking equality</dt>
              <dd className="mt-1 text-base text-white/80">{formatPercent(score.turnTakingEquality)}</dd>
            </div>
          </dl>
          <p role="status" aria-live="polite" data-testid="ci-verdict" className="mt-4 text-sm text-muted-foreground">
            {getTeamVerdict(score)}
          </p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground" data-testid="ci-hint">
          Select {TEAM_SIZE - selected.length} more to score the group.
        </p>
      )}

      <p className="mt-5 text-xs text-muted-foreground/80">
        Scoring model after Woolley, Chabris, Pentland, Hashmi &amp; Malone (2010),{' '}
        <em>Evidence for a Collective Intelligence Factor in the Performance of Human Groups</em>, Science
        330:686&ndash;688.
      </p>
    </div>
  );
}
