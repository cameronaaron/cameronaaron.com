'use client';

import { useCallback, useState } from 'react';

import {
  INITIAL_SCORE_STATE,
  MAZE_ARIA_LABEL,
  ODOR_PROFILES,
  checkPrediction,
  computeScoreUpdate,
  generateRound,
  getArmAriaLabel,
  getArmClassName,
  getArmVisualState,
  getInitialRound,
  getRodentLabel,
  getRoundResultMessage,
  type MazeArm,
} from '@/components/projects/toxoplasma/toxoplasma-logic';

/**
 * "Fatal Feline Attraction" — the Y-maze odor-choice task paired with the
 * "Toxoplasma Gondii Modifies Personality" essay. The player predicts which
 * arm a rodent enters; the reveal explains the mechanism.
 *
 * All round generation, choice prediction, scoring and copy live in
 * ./toxoplasma-logic (modularization contract); this component only wires that
 * state to markup. The first round comes from a fixed seed so the
 * server-rendered HTML and the client's first paint match exactly (CLAUDE.md
 * #10) — only rounds requested after a click seed off `Date.now()`, a path
 * that never runs during the initial render.
 *
 * Every interaction here is O(1): a click resolves one round through pure
 * lookups, with no collection scans and no per-frame work at all — this widget
 * has no animation loop to gate (ENGINEERING-STANDARDS §1).
 */
export default function ToxoplasmaMaze() {
  const [round, setRound] = useState(getInitialRound);
  const [resolved, setResolved] = useState(false);
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);
  const [message, setMessage] = useState('');

  const handlePredict = useCallback(
    (arm: MazeArm) => {
      const correct = checkPrediction(round, arm);
      setResolved(true);
      setScoreState((current) => computeScoreUpdate(current, correct));
      setMessage(getRoundResultMessage(round, correct));
    },
    [round]
  );

  const handleNextRound = useCallback(() => {
    setRound(generateRound(Date.now()));
    setResolved(false);
    setMessage('');
  }, []);

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="toxoplasma-maze"
      aria-label={MAZE_ARIA_LABEL}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Fatal Feline Attraction</h3>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Score <strong data-testid="toxo-score" className="text-cyan-300">{scoreState.score}</strong>
          </span>
          <span>
            Streak <strong data-testid="toxo-streak" className="text-emerald-300">{scoreState.streak}</strong>
          </span>
          <span>
            Best <strong data-testid="toxo-best" className="text-amber-300">{scoreState.bestStreak}</strong>
          </span>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        A rodent sits at the base of a Y-maze. Predict which arm it enters. Infected rodents lose their innate
        aversion to <em>cat</em> odor — the parasite&rsquo;s definitive host — but keep normal aversion to other
        predators, so &ldquo;infected means fearless&rdquo; will cost you.
      </p>

      <div
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2"
        data-testid="toxo-rodent"
      >
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${round.infected ? 'bg-rose-400' : 'bg-emerald-400'}`}
        />
        <span className="text-sm font-medium text-white">{getRodentLabel(round.infected)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(['a', 'b'] as const).map((arm) => {
          const cue = arm === 'a' ? round.armA : round.armB;
          const profile = ODOR_PROFILES[cue];
          return (
            <button
              key={arm}
              type="button"
              onClick={() => handlePredict(arm)}
              disabled={resolved}
              aria-label={getArmAriaLabel(cue, arm)}
              data-testid={`toxo-arm-${arm}`}
              className={`min-h-[44px] rounded-xl border p-4 text-left transition-colors disabled:cursor-default ${getArmClassName(
                getArmVisualState(arm, round, resolved)
              )}`}
            >
              <span className="block text-base font-semibold text-white">{profile.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{profile.detail}</span>
            </button>
          );
        })}
      </div>

      <p
        role="status"
        aria-live="polite"
        data-testid="toxo-message"
        className="mt-5 min-h-[3rem] text-sm text-muted-foreground"
      >
        {message}
      </p>

      {resolved ? (
        <button
          type="button"
          onClick={handleNextRound}
          data-testid="toxo-next"
          className="min-h-[44px] rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          Next rodent
        </button>
      ) : null}

      <p className="mt-5 text-xs text-muted-foreground/80">
        Behaviour model after Berdoy, Webster &amp; Macdonald (2000),{' '}
        <em>Fatal attraction in rats infected with Toxoplasma gondii</em>, Proc. R. Soc. B 267:1591.
      </p>
    </div>
  );
}
