'use client';

import { useCallback, useState } from 'react';

import {
  AVERAGE_COMPOSITE_MAX,
  AVERAGE_COMPOSITE_MIN,
  IDENTIFICATION_ARIA_LABEL,
  INITIAL_SCORE_STATE,
  NOTABLE_SCATTER_THRESHOLD,
  PROFILE_DESCRIPTORS,
  STUDENT_PROFILES,
  checkClassification,
  computeScoreUpdate,
  generateCase,
  getCaseResultMessage,
  getInitialCase,
  getMaskingSummary,
  getOptionAriaLabel,
  getOptionClassName,
  getOptionVisualState,
  isAverageComposite,
  isNotableScatter,
  type StudentProfile,
} from '@/components/projects/twice-exceptional/twice-exceptional-logic';

/**
 * "Who Gets Missed?" — the twice-exceptional identification task paired with
 * the "Bridging Transitions" capstone. Read a student's assessment summary,
 * classify them, and find out what the numbers actually indicated.
 *
 * All case generation, classification and copy live in
 * ./twice-exceptional-logic (modularization contract). The first case comes
 * from a fixed seed so server HTML and the client's first paint agree
 * (CLAUDE.md #10); later cases seed off `Date.now()`, a path that never runs
 * during the initial render. No animation loop, so nothing to visibility-gate.
 */
export default function TwiceExceptionalGame() {
  const [studentCase, setStudentCase] = useState(getInitialCase);
  const [chosen, setChosen] = useState<StudentProfile | null>(null);
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);
  const [message, setMessage] = useState('');

  const handleClassify = useCallback(
    (profile: StudentProfile) => {
      const correct = checkClassification(studentCase, profile);
      setChosen(profile);
      setScoreState((current) => computeScoreUpdate(current, studentCase, correct));
      setMessage(getCaseResultMessage(studentCase, correct));
    },
    [studentCase]
  );

  const handleNextCase = useCallback(() => {
    setStudentCase(generateCase(Date.now()));
    setChosen(null);
    setMessage('');
  }, []);

  const resolved = chosen !== null;

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="twice-exceptional-game"
      aria-label={IDENTIFICATION_ARIA_LABEL}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Who Gets Missed?</h3>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Correct <strong data-testid="te-score" className="text-cyan-300">{scoreState.score}</strong>
          </span>
          <span>
            Streak <strong data-testid="te-streak" className="text-emerald-300">{scoreState.streak}</strong>
          </span>
          <span>
            2e caught{' '}
            <strong data-testid="te-caught" className="text-amber-300">
              {scoreState.twiceExceptionalCaught}/{scoreState.twiceExceptionalSeen}
            </strong>
          </span>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        Classify the student from their assessment summary. A gifted student with a co-occurring disability can post a
        perfectly ordinary composite, because the two mask each other — so the composite alone will not save you.
      </p>

      <div className="mb-5 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
        <div>
          <span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">Composite score</span>
          <span className="mt-1 block text-xs text-muted-foreground/80">
            One overall test score, like an IQ score. Typical range: {AVERAGE_COMPOSITE_MIN}&ndash;
            {AVERAGE_COMPOSITE_MAX}.
          </span>
          <span data-testid="te-composite" className="mt-2 block font-display text-3xl text-white">
            {studentCase.composite}
          </span>
          <span className="mt-1 block text-sm font-medium text-white/90">
            {isAverageComposite(studentCase.composite)
              ? 'This student: within the typical range'
              : 'This student: outside the typical range'}
          </span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">Subtest scatter</span>
          <span className="mt-1 block text-xs text-muted-foreground/80">
            The gap between this student&rsquo;s strongest and weakest subject scores. A gap of{' '}
            {NOTABLE_SCATTER_THRESHOLD}+ points is wide enough to be worth a second look.
          </span>
          <span
            data-testid="te-scatter"
            className={`mt-2 block font-display text-3xl ${
              isNotableScatter(studentCase.scatter) ? 'text-amber-300' : 'text-white'
            }`}
          >
            {studentCase.scatter}
          </span>
          <span className="mt-1 block text-sm font-medium text-white/90">
            {isNotableScatter(studentCase.scatter)
              ? 'This student: unusually wide gap'
              : 'This student: ordinary variation'}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {STUDENT_PROFILES.map((profile) => (
          <button
            key={profile}
            type="button"
            onClick={() => handleClassify(profile)}
            disabled={resolved}
            aria-label={getOptionAriaLabel(profile)}
            data-testid={`te-option-${profile}`}
            className={`min-h-[44px] rounded-xl border px-4 py-3 text-left text-sm text-white transition-colors disabled:cursor-default ${getOptionClassName(
              getOptionVisualState(profile, studentCase, chosen)
            )}`}
          >
            {PROFILE_DESCRIPTORS[profile].label}
          </button>
        ))}
      </div>

      <p
        role="status"
        aria-live="polite"
        data-testid="te-message"
        className="mt-5 min-h-[3.5rem] text-sm text-muted-foreground"
      >
        {message}
      </p>

      {resolved ? (
        <button
          type="button"
          onClick={handleNextCase}
          data-testid="te-next"
          className="min-h-[44px] rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          Next student
        </button>
      ) : null}

      <p className="mt-6 border-t border-white/10 pt-4 text-xs text-muted-foreground/80" data-testid="te-masking">
        {getMaskingSummary(scoreState)}
      </p>
    </div>
  );
}
