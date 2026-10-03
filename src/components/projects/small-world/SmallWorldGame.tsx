'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  INITIAL_CHAIN,
  LINKS,
  PEOPLE,
  buildChainLinkKeys,
  createChain,
  extendChain,
  getGroupFillClass,
  getLinkClassName,
  getLinkDash,
  getMutualityNote,
  getResultText,
  hops,
  isComplete,
  linkKey,
  nextChoices,
  targetOf,
  undoStep,
} from '@/components/projects/small-world/small-world-logic';

/**
 * "Shortest Chain" — the playable companion to the social-graph crawler. The
 * player builds a chain of friends between two friend groups and is scored
 * against breadth-first search, then can restrict the search to confirmed
 * mutual links. Graph, BFS and copy live in ./small-world-logic; this
 * component renders state. Each click is O(degree); BFS runs only when a
 * chain completes.
 */
export default function SmallWorldGame() {
  const [state, setState] = useState(INITIAL_CHAIN);

  const choices = useMemo(() => nextChoices(state), [state]);
  const chainLinks = useMemo(() => buildChainLinkKeys(state.chain), [state.chain]);
  const onChain = useMemo(() => new Set(state.chain), [state.chain]);
  const complete = isComplete(state);
  const target = targetOf(state);
  const start = state.chain[0];
  const mutualityNote = useMemo(() => (complete ? getMutualityNote(start, target) : null), [complete, start, target]);

  const handleChoose = useCallback((person: number) => setState((current) => extendChain(current, person)), []);
  const handleUndo = useCallback(() => setState(undoStep), []);
  const handleNext = useCallback(() => setState((current) => createChain(current.round + 1, current.mutualOnly)), []);
  const handleToggle = useCallback(() => setState((current) => createChain(current.round, !current.mutualOnly)), []);

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="small-world-game"
      role="group"
      aria-label="Shortest Chain: connect two people across friend groups"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Shortest Chain</h3>
        <button
          type="button"
          aria-pressed={state.mutualOnly}
          onClick={handleToggle}
          data-testid="small-world-mutual"
          className="min-h-[44px] rounded-full border border-white/15 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-cyan-300/40 aria-pressed:border-cyan-300/60 aria-pressed:bg-cyan-400/15 aria-pressed:text-cyan-100"
        >
          Confirmed mutual only
        </button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground" data-testid="small-world-goal">
        Get from <strong className="text-white">{PEOPLE[start].name}</strong> to{' '}
        <strong className="text-white">{PEOPLE[target].name}</strong> through people who know each other. Dashed links
        were only seen in one direction.
      </p>

      <svg viewBox="0 0 100 54" className="mb-4 h-auto w-full" role="img" aria-label={`Chain so far: ${state.chain.map((p) => PEOPLE[p].name).join(', ')}`}>
        {LINKS.map(([a, b, direction]) => (
          <line
            key={linkKey(a, b)}
            x1={PEOPLE[a].x}
            y1={PEOPLE[a].y}
            x2={PEOPLE[b].x}
            y2={PEOPLE[b].y}
            strokeWidth={chainLinks.has(linkKey(a, b)) ? 0.9 : 0.35}
            strokeDasharray={getLinkDash(direction)}
            className={getLinkClassName(direction, chainLinks.has(linkKey(a, b)))}
          />
        ))}
        {PEOPLE.map((person, index) => (
          <g key={person.name} data-testid={`small-world-person-${index}`} data-on-chain={onChain.has(index)}>
            <circle
              cx={person.x}
              cy={person.y}
              r={index === target ? 2.6 : 2}
              className={`${getGroupFillClass(person.group)} ${onChain.has(index) || index === target ? 'stroke-white' : 'stroke-transparent'}`}
              strokeWidth={0.5}
            />
            <text x={person.x} y={person.y + 5} textAnchor="middle" className="fill-white/70 text-[2.6px]">
              {person.name}
            </text>
          </g>
        ))}
      </svg>

      {complete ? null : (
        <div className="flex flex-wrap gap-2" data-testid="small-world-choices">
          {choices.map((person) => (
            <button
              key={person}
              type="button"
              onClick={() => handleChoose(person)}
              data-testid={`small-world-choose-${person}`}
              className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white transition-colors hover:border-cyan-300/60 hover:bg-cyan-400/10"
            >
              {PEOPLE[person].name}
            </button>
          ))}
          {choices.length === 0 ? <p className="text-sm text-muted-foreground">Dead end — undo a step.</p> : null}
        </div>
      )}

      <p role="status" aria-live="polite" data-testid="small-world-result" className="mt-4 min-h-[2.5rem] text-sm text-muted-foreground">
        {complete ? getResultText(state) : `${hops(state.chain)} hops so far.`}
      </p>
      {mutualityNote ? (
        <p className="mb-3 text-sm text-amber-200/90" data-testid="small-world-note">
          {mutualityNote}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {state.chain.length > 1 && !complete ? (
          <button
            type="button"
            onClick={handleUndo}
            data-testid="small-world-undo"
            className="min-h-[44px] rounded-full border border-white/15 px-5 text-sm text-muted-foreground transition-colors hover:border-white/30"
          >
            Undo
          </button>
        ) : null}
        {complete ? (
          <button
            type="button"
            onClick={handleNext}
            data-testid="small-world-next"
            className="min-h-[44px] rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
          >
            Next pair
          </button>
        ) : null}
      </div>

      <p className="mt-6 border-t border-white/10 pt-4 text-xs text-muted-foreground/80">
        The crawler&rsquo;s tour mode walks the true shortest path between friend groups, found by breadth-first search.
        It also records which direction each link was seen in, because Instagram caps the followers list far more than
        the following list: a link seen one way may just be the other half going unobserved.
      </p>
    </div>
  );
}
