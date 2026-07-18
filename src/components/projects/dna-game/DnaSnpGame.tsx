'use client';

import { useCallback, useEffect, useState } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import {
  INITIAL_SCORE_STATE,
  ROUND_ADVANCE_DELAY_MS,
  STRAND_LENGTH,
  checkGuess,
  computeScoreUpdate,
  generateRound,
  getBaseColorClass,
  getInitialRound,
  getRoundResultMessage,
  getTileAriaLabel,
  getTileClassName,
  getTileVisualState,
  type RoundState,
  type ScoreState,
} from '@/components/projects/dna-game/dna-snp-game-logic';

/**
 * "Spot the SNP" — a playable DNA/genomics mini-game paired with the
 * Genetic RefleXions Magic Mirror project. The player taps the tile in the
 * SAMPLE strand that differs from the REFERENCE strand (the SNP — a
 * single-nucleotide polymorphism). All round generation, scoring, and
 * per-tile visual-state derivation lives in ./dna-snp-game-logic; this
 * component only wires state to markup.
 *
 * The very first round is seeded with the fixed INITIAL_ROUND_SEED so the
 * server-rendered HTML and the client's first paint show an identical
 * round (CLAUDE.md #10 — hydration safety). Every subsequent round is
 * generated only inside a click handler (handleNextRound), so seeding off
 * Date.now() there is safe — it never runs during initial render.
 */
export default function DnaSnpGame() {
  const { prefersReducedMotion } = useInteractionMode();

  const [round, setRound] = useState(getInitialRound);
  const [roundState, setRoundState] = useState<RoundState>('guessing');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [scoreState, setScoreState] = useState<ScoreState>(INITIAL_SCORE_STATE);
  const [message, setMessage] = useState('');

  const handleNextRound = useCallback(() => {
    setRound(generateRound(Date.now(), STRAND_LENGTH));
    setRoundState('guessing');
    setSelectedIndex(null);
    setMessage('');
  }, []);

  // Correct guesses auto-advance after a short beat; an incorrect guess
  // waits for the explicit "Next round" click below (same button covers
  // both — it also lets a player skip the auto-advance wait early).
  useEffect(() => {
    if (roundState !== 'correct') return undefined;

    const timeoutId = window.setTimeout(handleNextRound, ROUND_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [roundState, handleNextRound]);

  // No in-handler guessing-state guard needed here: every sample tile's
  // `disabled` attribute below is the single source of truth once a round
  // has resolved, and disabled buttons never dispatch click events.
  const handleGuess = (index: number) => {
    const correct = checkGuess(round, index);
    setSelectedIndex(index);
    setRoundState(correct ? 'correct' : 'incorrect');
    setScoreState((current) => computeScoreUpdate(current, correct));
    setMessage(getRoundResultMessage(correct, round.snpIndex, round.reference[round.snpIndex]));
  };

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md" data-testid="dna-snp-game">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Spot the SNP</h3>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Score <strong data-testid="dna-game-score" className="text-cyan-300">{scoreState.score}</strong>
          </span>
          <span>
            Streak <strong data-testid="dna-game-streak" className="text-emerald-300">{scoreState.streak}</strong>
          </span>
          <span>
            Best <strong data-testid="dna-game-best-streak" className="text-fuchsia-300">{scoreState.bestStreak}</strong>
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Tap the base in the sample strand that differs from the reference strand — that one tile is the SNP (a
        single-nucleotide polymorphism, a real DNA variation).
      </p>

      <div className="mb-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Reference strand
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="sr-only">Reference sequence: {round.reference.join(' ')}</span>
          {round.reference.map((base, index) => (
            <div
              key={`ref-${index}`}
              aria-hidden="true"
              className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-bold text-white ${getBaseColorClass(base)}`}
            >
              {base}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Sample strand — tap the base that differs
        </p>
        <div className="flex flex-wrap gap-1.5">
          {round.sample.map((base, index) => {
            const tileState = getTileVisualState(index, round, roundState, selectedIndex);
            const tileClassName = getTileClassName(tileState, Boolean(prefersReducedMotion));

            return (
              <button
                key={`sample-${index}`}
                type="button"
                disabled={roundState !== 'guessing'}
                onClick={() => handleGuess(index)}
                aria-label={getTileAriaLabel(index + 1, base)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-bold text-white transition-colors disabled:cursor-default ${getBaseColorClass(base)} ${tileClassName}`}
              >
                {base}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          data-testid="dna-game-message"
          className="min-h-[1.25rem] text-sm font-medium text-cyan-200"
        >
          {message}
        </p>
        {roundState !== 'guessing' && (
          <button
            type="button"
            data-testid="dna-game-next-round"
            onClick={handleNextRound}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            Next round
          </button>
        )}
      </div>
    </div>
  );
}
