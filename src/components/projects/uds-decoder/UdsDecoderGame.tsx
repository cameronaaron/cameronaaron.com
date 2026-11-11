'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  INITIAL_SCORE_STATE,
  MODULE_HEADER,
  computeScoreUpdate,
  formatDid,
  formatRequest,
  getByteRole,
  getByteRoleClassName,
  getInitialRound,
  getNextRound,
  getOptionClassName,
  getOptionVisualState,
  getResultMessage,
  parseHexBytes,
  type DecodeOption,
} from '@/components/projects/uds-decoder/uds-decoder-logic';

/**
 * "Decode the Response" — the playable companion to Mechanic. Each round is
 * one of the project's own test vectors; the wrong answers are what specific
 * decoding mistakes produce. Catalog, decoding and scoring live in
 * ./uds-decoder-logic (modularization contract); this component wires state
 * to markup. Every interaction is O(1) and there is no animation loop.
 */
export default function UdsDecoderGame() {
  const [round, setRound] = useState(getInitialRound);
  const [chosen, setChosen] = useState<DecodeOption | null>(null);
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);

  const handleAnswer = useCallback((option: DecodeOption) => {
    setChosen(option);
    setScoreState((current) => computeScoreUpdate(current, option.mistake === null));
  }, []);

  const handleNext = useCallback(() => {
    setRound(getNextRound);
    setChosen(null);
  }, []);

  const { challenge } = round;
  const bytes = useMemo(() => parseHexBytes(challenge.responseHex), [challenge.responseHex]);

  return (
    <div
      className="mt-8 rounded-2xl border border-foreground/10 bg-surface p-6"
      data-testid="uds-decoder-game"
      role="group"
      aria-label="Decode the Response: read a vehicle module's diagnostic reply"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">Decode the Response</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Score <strong data-testid="uds-score" className="text-primary">{scoreState.score}</strong>
          </span>
          <span>
            Best streak <strong data-testid="uds-best" className="text-warning">{scoreState.bestStreak}</strong>
          </span>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        A tester sent <span className="font-data text-foreground/80">{formatRequest(challenge.did)}</span>{' '}
        (ReadDataByIdentifier). This is what came back. What does it say?
      </p>

      <div className="mb-5 rounded-xl border border-foreground/10 bg-surface p-5" data-testid="uds-prompt">
        <p className="mb-3 text-xs text-muted-foreground">{MODULE_HEADER}</p>
        <ol className="mb-4 flex flex-wrap gap-2" aria-label={`Response bytes ${challenge.responseHex}`}>
          {bytes.map((byte, position) => (
            <li
              key={position}
              data-testid={`uds-byte-${position}`}
              data-role={getByteRole(position)}
              className={`rounded-lg border px-2.5 py-1.5 font-data text-base ${getByteRoleClassName(getByteRole(position))}`}
            >
              {byte.toString(16).toUpperCase().padStart(2, '0')}
            </li>
          ))}
        </ol>
        <dl className="grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="inline text-foreground/70">Signal </dt>
            <dd className="inline">{challenge.label}</dd>
          </div>
          <div>
            <dt className="inline text-foreground/70">Identifier </dt>
            <dd className="inline font-data">{formatDid(challenge.did)}</dd>
          </div>
          <div>
            <dt className="inline text-foreground/70">Bits </dt>
            <dd className="inline font-data">0:{challenge.bits}{challenge.signed ? ', signed' : ''}</dd>
          </div>
          <div>
            <dt className="inline text-foreground/70">Formula </dt>
            <dd className="inline font-data">{challenge.formulaText}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {round.options.map((option) => (
          <button
            key={option.text}
            type="button"
            onClick={() => handleAnswer(option)}
            disabled={chosen !== null}
            data-testid={`uds-option-${option.mistake ?? 'correct'}`}
            className={`min-h-[44px] rounded-xl border px-4 py-3 font-data text-base text-foreground transition-colors disabled:cursor-default ${
              getOptionClassName(getOptionVisualState(option, chosen))
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" data-testid="uds-message" className="mt-5 min-h-[3.5rem] text-sm text-muted-foreground">
        {chosen === null ? '' : getResultMessage(round, chosen)}
      </p>

      {chosen !== null ? (
        <button
          type="button"
          onClick={handleNext}
          data-testid="uds-next"
          className="min-h-[44px] rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Next response
        </button>
      ) : null}

      <p className="mt-6 border-t border-foreground/10 pt-4 text-xs text-muted-foreground/80">
        Every reply here is a test vector from Mechanic&rsquo;s F-150 PCM definition. The scalings come from community
        sources (OBDb, elm327_obd_for_mac) and are marked unverified until someone captures them on a truck; the vectors
        prove the arithmetic, which is what lets a reviewer merge a contribution without trusting its bit offsets.
      </p>
    </div>
  );
}
