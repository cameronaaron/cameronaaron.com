'use client';

import { useCallback, useState } from 'react';

import {
  DIALECT_ARIA_LABEL,
  INITIAL_SCORE_STATE,
  RULE_PROFILES,
  checkAnswer,
  computeScoreUpdate,
  generateRound,
  getInitialRound,
  getOptionAriaLabel,
  getOptionClassName,
  getOptionVisualState,
  getRoundResultMessage,
} from '@/components/projects/tohoku/tohoku-dialect-logic';

/**
 * "Hear the Shift" — the Tohoku-dialect phonology task paired with the
 * "Differences Between Standard Japanese & Tohoku Dialects" essay. The player
 * picks a Standard Japanese word's Tohoku realization from three candidates,
 * each produced by a different real sound change.
 *
 * The catalog, round generation, scoring and explanations all live in
 * ./tohoku-dialect-logic (modularization contract); this component only wires
 * state to markup. The first round comes from a fixed seed so the
 * server-rendered HTML matches the client's first paint (CLAUDE.md #10) — only
 * post-click rounds seed off `Date.now()`, a path that never runs during the
 * initial render.
 *
 * Every interaction is O(1): one click resolves a round through pure lookups,
 * with no scans and no animation loop to gate (ENGINEERING-STANDARDS §1).
 */
export default function TohokuDialectGame() {
  const [round, setRound] = useState(getInitialRound);
  const [chosen, setChosen] = useState<string | null>(null);
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);
  const [message, setMessage] = useState('');

  const handleAnswer = useCallback(
    (option: string) => {
      const correct = checkAnswer(round, option);
      setChosen(option);
      setScoreState((current) => computeScoreUpdate(current, correct));
      setMessage(getRoundResultMessage(round.item, correct));
    },
    [round]
  );

  const handleNextRound = useCallback(() => {
    setRound(generateRound(Date.now()));
    setChosen(null);
    setMessage('');
  }, []);

  const resolved = chosen !== null;

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="tohoku-dialect-game"
      aria-label={DIALECT_ARIA_LABEL}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Hear the Shift</h3>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Score <strong data-testid="tohoku-score" className="text-cyan-300">{scoreState.score}</strong>
          </span>
          <span>
            Streak <strong data-testid="tohoku-streak" className="text-emerald-300">{scoreState.streak}</strong>
          </span>
          <span>
            Best <strong data-testid="tohoku-best" className="text-amber-300">{scoreState.bestStreak}</strong>
          </span>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        How would a Tohoku speaker pronounce this word? Each wrong option is what a{' '}
        <em>different</em> real Tohoku sound change would produce, so guessing by shape won&rsquo;t hold up.
      </p>

      <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-5 text-center" data-testid="tohoku-prompt">
        <span className="block text-3xl font-bold text-white">{round.item.kana}</span>
        <span className="mt-2 block font-mono-accent text-lg text-cyan-200">{round.item.standard}</span>
        <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Standard Japanese &middot; &ldquo;{round.item.gloss}&rdquo;
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {round.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleAnswer(option)}
            disabled={resolved}
            aria-label={getOptionAriaLabel(option, round.item)}
            data-testid={`tohoku-option-${option}`}
            className={`min-h-[44px] rounded-xl border px-4 py-3 font-mono-accent text-base text-white transition-colors disabled:cursor-default ${getOptionClassName(
              getOptionVisualState(option, round, chosen)
            )}`}
          >
            {option}
          </button>
        ))}
      </div>

      <p
        role="status"
        aria-live="polite"
        data-testid="tohoku-message"
        className="mt-5 min-h-[3.5rem] text-sm text-muted-foreground"
      >
        {message}
      </p>

      {resolved ? (
        <button
          type="button"
          onClick={handleNextRound}
          data-testid="tohoku-next"
          className="min-h-[44px] rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          Next word
        </button>
      ) : null}

      <dl className="mt-6 grid gap-2 border-t border-white/10 pt-4 text-xs text-muted-foreground/80 sm:grid-cols-3">
        {(Object.keys(RULE_PROFILES) as Array<keyof typeof RULE_PROFILES>).map((rule) => (
          <div key={rule}>
            <dt className="font-medium text-white/70">{RULE_PROFILES[rule].label}</dt>
            <dd className="mt-0.5">{RULE_PROFILES[rule].summary}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
