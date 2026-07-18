'use client';

import { useCallback, useEffect, useState } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import {
  INITIAL_SESSION_STATS,
  computeRandomDelayMs,
  computeStatsUpdate,
  formatMs,
  getAverageReactionMs,
  getResultMessage,
  getTargetAriaLabel,
  getTargetClassName,
  resolveClick,
  type RoundPhase,
  type RoundResult,
  type SessionStats,
} from '@/components/projects/reaction-game/reaction-time-game-logic';

/**
 * "Catch the Lapse" — a playable simple-visual-reaction-time task paired
 * with the "Lapses in Sustained Attention Predicted by Changes in
 * Visually-Guided Movements" research project. Wait for the target to
 * change appearance, then click it as fast as possible; clicking before it
 * changes is a "false start" (an anticipatory response) — the same class
 * of attention lapse the original research measured, flagged distinctly
 * rather than punished. All round timing, reaction-time computation, and
 * scoring lives in ./reaction-time-game-logic; this component only wires
 * state to markup.
 *
 * The component's very first render never depends on a random or
 * time-based value: phase/goTimestamp/lastResult/stats all start from
 * plain constants (CLAUDE.md #10 — hydration safety). The random pre-go
 * delay is drawn only inside the scheduling effect below, and the reaction
 * time is measured only inside the click handler — both run exclusively on
 * the client, after mount, so seeding off Math.random()/performance.now()
 * there is safe.
 */
export default function ReactionTimeGame() {
  const { prefersReducedMotion } = useInteractionMode();

  const [phase, setPhase] = useState<RoundPhase>('waiting');
  const [goTimestamp, setGoTimestamp] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [stats, setStats] = useState<SessionStats>(INITIAL_SESSION_STATS);

  // Every time a round enters 'waiting' (initial mount, or after Try again),
  // schedule the random "go" delay. If the player clicks early (false
  // start) or the round otherwise leaves 'waiting', this effect's cleanup
  // clears the pending timer so it can never fire late against a resolved
  // round (lifecycle-hygiene contract).
  useEffect(() => {
    if (phase !== 'waiting') return undefined;

    const delayMs = computeRandomDelayMs(Math.random());
    const timeoutId = window.setTimeout(() => {
      setGoTimestamp(performance.now());
      setPhase('go');
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [phase]);

  // No in-handler phase guard needed: the target button's `disabled`
  // attribute below is the single source of truth once a round has
  // resolved, and disabled buttons never dispatch click events. A click
  // while still 'waiting' is a legitimate false start, not a bug.
  const handleTargetClick = useCallback(() => {
    const clickTimestamp = performance.now();
    const result = resolveClick(phase, goTimestamp, clickTimestamp);

    setLastResult(result);
    setStats((current) => computeStatsUpdate(current, result));
    setPhase('result');
  }, [phase, goTimestamp]);

  const handleTryAgain = useCallback(() => {
    setGoTimestamp(null);
    setLastResult(null);
    setPhase('waiting');
  }, []);

  const message = lastResult ? getResultMessage(lastResult) : '';
  const averageMs = getAverageReactionMs(stats);
  const targetLabel = phase === 'go' ? 'Click!' : phase === 'waiting' ? 'Wait...' : 'Done';

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="reaction-time-game"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Catch the Lapse</h3>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Last{' '}
            <strong data-testid="reaction-game-last" className="text-cyan-300">
              {stats.lastReactionMs === null ? '—' : formatMs(stats.lastReactionMs)}
            </strong>
          </span>
          <span>
            Avg{' '}
            <strong data-testid="reaction-game-average" className="text-emerald-300">
              {averageMs === null ? '—' : formatMs(averageMs)}
            </strong>
          </span>
          <span>
            Best{' '}
            <strong data-testid="reaction-game-best" className="text-fuchsia-300">
              {stats.bestMs === null ? '—' : formatMs(stats.bestMs)}
            </strong>
          </span>
          <span>
            Rounds <strong data-testid="reaction-game-rounds" className="text-white">{stats.roundsPlayed}</strong>
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Wait for the circle to turn green, then click it as fast as you can — that&apos;s a real simple visual
        reaction-time task, the same kind used to study attention lapses. Click before it turns green and
        that&apos;s a false start, not a mistake to punish.
      </p>

      <div className="mb-4 flex justify-center">
        <button
          type="button"
          data-testid="reaction-game-target"
          disabled={phase === 'result'}
          onClick={handleTargetClick}
          aria-label={getTargetAriaLabel(phase)}
          className={`flex h-32 w-32 items-center justify-center rounded-full border-4 font-mono text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors disabled:cursor-default ${getTargetClassName(phase, Boolean(prefersReducedMotion))}`}
        >
          {targetLabel}
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p
          role="status"
          aria-live="polite"
          data-testid="reaction-game-message"
          className="min-h-[1.25rem] text-sm font-medium text-cyan-200"
        >
          {message}
        </p>
        {phase === 'result' && (
          <button
            type="button"
            data-testid="reaction-game-try-again"
            onClick={handleTryAgain}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
