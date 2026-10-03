'use client';

import { useCallback, useState } from 'react';

import {
  ALL_NODES,
  RECORD_COUNT,
  STORAGE_MODES,
  USER_NAMES,
  createGame,
  getAccuracyText,
  getGuessClassName,
  getGuessVisualState,
  getModeClassName,
  getNodeVisualState,
  getObservationText,
  getResultText,
  nodePosition,
  startRound,
  submitGuess,
  switchMode,
  type StorageMode,
} from '@/components/projects/oram/oram-access-logic';

/**
 * "Whose Record Was Read?" — the playable companion to novachannel. The
 * player is the server and guesses which user's record a read touched. The
 * Path ORAM, scoring and copy live in ./oram-access-logic; this component
 * only renders state. Every interaction is one O(log N) ORAM access.
 */
export default function OramAccessGame() {
  const [game, setGame] = useState(() => createGame());

  const handleGuess = useCallback((user: number) => setGame((current) => submitGuess(current, user)), []);
  const handleNext = useCallback(() => setGame(startRound), []);
  const handleMode = useCallback((mode: StorageMode) => setGame((current) => switchMode(current, mode)), []);

  const { observation } = game;
  const resolved = game.guess !== null;

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="oram-access-game"
      role="group"
      aria-label="Whose Record Was Read: guess which user a storage access belonged to"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Whose Record Was Read?</h3>
        <div className="flex gap-2" role="group" aria-label="Storage the server is running">
          {STORAGE_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              aria-pressed={game.mode === mode}
              onClick={() => handleMode(mode)}
              data-testid={`oram-mode-${mode}`}
              className={`min-h-[44px] rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${getModeClassName(
                game.mode === mode
              )}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        You run the server. The messages are end-to-end encrypted, so you can&rsquo;t read anything — but one of eight
        users just read their own record, and you can see which storage it touched. Who was it?
      </p>

      <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4" data-testid="oram-view">
        {observation.mode === 'plain' ? (
          <ol className="grid grid-cols-8 gap-1.5" aria-label="Record slots">
            {Array.from({ length: RECORD_COUNT }, (_, slot) => (
              <li
                key={slot}
                data-testid={`oram-slot-${slot}`}
                data-touched={slot === observation.slot}
                className={`rounded-md border py-3 text-center font-mono-accent text-xs ${
                  slot === observation.slot
                    ? 'border-amber-300/80 bg-amber-400/25 text-amber-100'
                    : 'border-white/10 bg-black/30 text-muted-foreground'
                }`}
              >
                {slot + 1}
              </li>
            ))}
          </ol>
        ) : (
          <svg viewBox="0 0 100 60" className="h-auto w-full" role="img" aria-label={getObservationText(observation)}>
            {ALL_NODES.map((node) =>
              node === 1 ? null : (
                <line
                  key={`edge-${node}`}
                  x1={nodePosition(node >> 1).x}
                  y1={nodePosition(node >> 1).y}
                  x2={nodePosition(node).x}
                  y2={nodePosition(node).y}
                  strokeWidth={0.5}
                  className={getNodeVisualState(node, observation) === 'touched' ? 'stroke-amber-300' : 'stroke-white/15'}
                />
              )
            )}
            {ALL_NODES.map((node) => (
              <rect
                key={node}
                data-testid={`oram-node-${node}`}
                data-touched={getNodeVisualState(node, observation) === 'touched'}
                x={nodePosition(node).x - 4}
                y={nodePosition(node).y - 3}
                width={8}
                height={6}
                rx={1.2}
                className={
                  getNodeVisualState(node, observation) === 'touched'
                    ? 'fill-amber-400/40 stroke-amber-200'
                    : 'fill-black/40 stroke-white/20'
                }
                strokeWidth={0.4}
              />
            ))}
          </svg>
        )}
        <p className="mt-3 text-xs text-muted-foreground" data-testid="oram-observation">
          {getObservationText(observation)}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {USER_NAMES.map((name, user) => (
          <button
            key={name}
            type="button"
            onClick={() => handleGuess(user)}
            disabled={resolved}
            data-testid={`oram-guess-${user}`}
            className={`min-h-[44px] rounded-xl border px-2 text-sm text-white transition-colors disabled:cursor-default ${getGuessClassName(
              getGuessVisualState(game, user)
            )}`}
          >
            {name}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" data-testid="oram-result" className="mt-5 min-h-[3rem] text-sm text-muted-foreground">
        {getResultText(game)}
      </p>

      {resolved ? (
        <button
          type="button"
          onClick={handleNext}
          data-testid="oram-next"
          className="min-h-[44px] rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          Next read
        </button>
      ) : null}

      <dl className="mt-6 grid grid-cols-1 gap-2 border-t border-white/10 pt-4 text-xs text-muted-foreground/80 sm:grid-cols-2">
        {STORAGE_MODES.map(({ mode, label }) => (
          <div key={mode}>
            <dt className="font-medium text-white/70">{label}</dt>
            <dd data-testid={`oram-accuracy-${mode}`}>{getAccuracyText(mode, game.stats[mode])}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground/80">
        This is the real algorithm (Stefanov et al., 2013): every read remaps the record to a random leaf and rewrites
        the whole path it came from. The price is touching log&#8322;N + 1 buckets instead of one slot — a proven lower
        bound, not an inefficiency.
      </p>
    </div>
  );
}
