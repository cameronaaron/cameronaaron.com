import type { ProgramView } from './dashboard-logic';
import { APPLICATION_TASKS } from './dashboard-logic';
import { DEGREE_TYPE_LABELS, getChemistryBadge, getProgramProgressCount } from './program-card-logic';
import PrereqChecklistRow from './PrereqChecklistRow';
import ApplicationStatusBadge from './ApplicationStatusBadge';
import ReadinessSummary from './ReadinessSummary';

interface ProgramCardProps {
  view: ProgramView;
  isStarred: boolean;
  onToggleStar: () => void;
  completedTaskIds: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
}

export default function ProgramCard({ view, isStarred, onToggleStar, completedTaskIds, onToggleTask }: ProgramCardProps) {
  const { program, matches, activeWindow, readiness } = view;
  const chemBadge = getChemistryBadge(program.requiresChemistry);
  const progress = getProgramProgressCount(matches);

  return (
    <article
      data-testid={`program-card-${program.id}`}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300">{program.city}</p>
          <h3 className="mt-1 text-xl font-bold text-foreground font-display">{program.institution}</h3>
          <p className="text-sm text-muted-foreground">{program.programName}</p>
        </div>
        <button
          type="button"
          onClick={onToggleStar}
          aria-pressed={isStarred}
          className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
            isStarred
              ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100'
              : 'border-white/15 bg-white/5 text-muted-foreground hover:border-emerald-300/30 hover:text-emerald-100'
          }`}
        >
          {isStarred ? '★ Applying' : '☆ Track this one'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
          {DEGREE_TYPE_LABELS[program.degreeType]}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${chemBadge.className}`}>{chemBadge.label}</span>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
          {progress.completed}/{progress.total} prereqs complete
        </span>
        <ApplicationStatusBadge activeWindow={activeWindow} />
      </div>

      <div className="mt-4">
        <ReadinessSummary readiness={readiness} />
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Prerequisites</h4>
        <ul className="space-y-1.5">
          {matches.map((match, index) => (
            <PrereqChecklistRow key={`${match.requirement.category}-${match.requirement.label}-${index}`} match={match} />
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Application tasks</h4>
        <ul className="space-y-1.5">
          {APPLICATION_TASKS.map((task) => {
            const inputId = `${program.id}-${task.id}`;
            return (
              <li key={task.id} className="flex items-center gap-2.5">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={completedTaskIds[task.id] ?? false}
                  onChange={() => onToggleTask(task.id)}
                  className="h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                />
                <label htmlFor={inputId} className="text-sm text-muted-foreground">
                  {task.label}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {program.notes ? <p className="mt-4 text-xs text-cyan-200/70">{program.notes}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {program.sourceUrls.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-emerald-300/35 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Official source
          </a>
        ))}
      </div>
    </article>
  );
}
