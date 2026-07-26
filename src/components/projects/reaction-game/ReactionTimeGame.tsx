'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
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
  isNewBestReaction,
  resolveClick,
  resolveClickTimestamp,
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
  const containerRef = useRef<HTMLDivElement>(null);
  // Below the fold inside Projects — without this, the "go" countdown was
  // scheduling itself the instant the page mounted, so a visitor could
  // arrive to find the target had already been sitting in "Click!" for a
  // while (or land mid-round with no context for what happened).
  const isInView = useInView(containerRef, { amount: 0.3 });

  const [phase, setPhase] = useState<RoundPhase>('waiting');
  const [goTimestamp, setGoTimestamp] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [stats, setStats] = useState<SessionStats>(INITIAL_SESSION_STATS);

  // Every time a round enters 'waiting' (initial mount, or after Try again),
  // schedule the random "go" delay. If the player clicks early (false
  // start) or the round otherwise leaves 'waiting', this effect's cleanup
  // clears the pending timer so it can never fire late against a resolved
  // round (lifecycle-hygiene contract). Also gated on isInView: scrolling
  // away mid-wait clears the pending timer, and scrolling back re-schedules
  // a fresh delay rather than resolving one nobody was present for.
  useEffect(() => {
    if (phase !== 'waiting' || !isInView) return undefined;

    const delayMs = computeRandomDelayMs(Math.random());
    const timeoutId = window.setTimeout(() => {
      setPhase('go');
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [phase, isInView]);

  // Reaction time must be measured from when the "go" stimulus was actually
  // PAINTED, not from the instant the setTimeout callback above fired.
  // React's state update, re-render, and the browser's commit/paint all take
  // real time — one frame under good conditions, more if the main thread is
  // busy with this page's other effects — and stamping goTimestamp before
  // any of that happens (the prior bug) systematically inflated EVERY
  // measured reaction by however long that render+paint took, making genuine
  // fast reactions read as merely typical and typical ones read as slow.
  // Waiting for the next animation frame after the phase flips to 'go'
  // aligns the timestamp with the frame the browser is about to paint — the
  // actual moment the player can see the change — using that frame's own
  // high-resolution timestamp rather than a separate performance.now() call.
  useEffect(() => {
    if (phase !== 'go') return undefined;

    const frameId = requestAnimationFrame((paintTime) => {
      setGoTimestamp(paintTime);
    });
    return () => cancelAnimationFrame(frameId);
  }, [phase]);

  // No in-handler phase guard needed: the target button's `disabled`
  // attribute below is the single source of truth once a round has
  // resolved, and disabled buttons never dispatch click events. A click
  // while still 'waiting' is a legitimate false start, not a bug.
  const handleTargetClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // event.timeStamp, not performance.now(): the former is when the browser
    // created the click, the latter is when this handler got scheduled. The
    // gap is input-queue delay and it inflated every reported reaction (see
    // resolveClickTimestamp).
    const clickTimestamp = resolveClickTimestamp(event.timeStamp, performance.now());
    const result = resolveClick(phase, goTimestamp, clickTimestamp);

    setLastResult(result);
    setIsNewBest(result.kind === 'reaction' && isNewBestReaction(stats.bestMs, result.reactionTimeMs));
    setStats((current) => computeStatsUpdate(current, result));
    setPhase('result');
  }, [phase, goTimestamp, stats.bestMs]);

  const handleTryAgain = useCallback(() => {
    setGoTimestamp(null);
    setLastResult(null);
    setIsNewBest(false);
    setPhase('waiting');
  }, []);

  const message = lastResult ? getResultMessage(lastResult, isNewBest) : '';
  const averageMs = getAverageReactionMs(stats);
  const targetLabel = phase === 'go' ? 'Click!' : phase === 'waiting' ? 'Wait...' : 'Done';

  return (
    <div
      ref={containerRef}
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
