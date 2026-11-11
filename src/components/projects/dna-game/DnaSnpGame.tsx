'use client';

import { useCallback, useState } from 'react';

import {
  INITIAL_SCORE_STATE,
  RAW_FILE_HEADER,
  computeScoreUpdate,
  describeLookup,
  getInitialRound,
  getNextRound,
  getOptionClassName,
  getOptionVisualState,
  getResultMessage,
} from '@/components/projects/dna-game/dna-snp-game-logic';

/**
 * "Read the Raw File" — the playable companion to Genetic RefleXions. The
 * player does what the mirror did: read a 23andMe raw-data row, consult the
 * GWAS association, count effect alleles, and call the trait. Catalog and
 * calls live in ./dna-snp-game-logic; this component wires state to markup.
 * Every interaction is O(1).
 */
export default function DnaSnpGame() {
  const [round, setRound] = useState(getInitialRound);
  const [chosen, setChosen] = useState<string | null>(null);
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);

  const handleAnswer = useCallback(
    (option: string) => {
      setChosen(option);
      setScoreState((current) => computeScoreUpdate(current, option === round.result.display));
    },
    [round]
  );

  const handleNext = useCallback(() => {
    setRound(getNextRound);
    setChosen(null);
  }, []);

  return (
    <div
      className="mt-8 rounded-2xl border border-foreground/10 bg-surface p-6"
      data-testid="dna-snp-game"
      role="group"
      aria-label="Read the Raw File: call a trait from a line of 23andMe raw data, the way the Genetic RefleXions mirror did"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">Read the Raw File</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Score <strong data-testid="dna-game-score" className="text-primary">{scoreState.score}</strong>
          </span>
          <span>
            Streak <strong data-testid="dna-game-streak" className="text-success">{scoreState.streak}</strong>
          </span>
          <span>
            Best <strong data-testid="dna-game-best-streak" className="text-warning">{scoreState.bestStreak}</strong>
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        A visitor plugs in their 23andMe file. The mirror reads this line, looks it up in SNPedia, and decides what to
        float around their reflection. What does it show?
      </p>

      <pre
        className="mb-3 overflow-x-auto rounded-xl border border-foreground/10 bg-surface p-4 font-data text-sm leading-relaxed"
        data-testid="dna-raw-line"
      >
        <span className="text-muted-foreground/70">{RAW_FILE_HEADER}</span>
        {'\n'}
        <span className="text-foreground">{round.line}</span>
      </pre>
      <p className="mb-5 text-sm text-foreground/80" data-testid="dna-association">
        {describeLookup(round)}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {round.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            onClick={() => handleAnswer(option)}
            disabled={chosen !== null}
            data-testid={`dna-option-${optionIndex}`}
            className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm text-foreground transition-colors disabled:cursor-default ${getOptionClassName(
              getOptionVisualState(option, round, chosen)
            )}`}
          >
            {option}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" data-testid="dna-game-message" className="mt-5 min-h-[3.5rem] text-sm text-muted-foreground">
        {chosen === null ? '' : getResultMessage(round, chosen)}
      </p>

      {chosen !== null ? (
        <button
          type="button"
          onClick={handleNext}
          data-testid="dna-game-next-round"
          className="min-h-[44px] rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Next line
        </button>
      ) : null}

      <p className="mt-6 border-t border-foreground/10 pt-4 text-xs text-muted-foreground/80">
        This is the mirror&rsquo;s own code path: sort the two alleles, look the pair up in SNPedia, drop anything under
        magnitude 2. Summaries are SNPedia&rsquo;s (CC BY-NC-SA), verbatim. They are associations, not diagnoses —
        which is why the mirror could only ever guess.
      </p>
    </div>
  );
}
