import { FULFILLMENT_STYLES, type RequirementMatch } from './matching-logic';

interface PrereqChecklistRowProps {
  match: RequirementMatch;
}

export default function PrereqChecklistRow({ match }: PrereqChecklistRowProps) {
  const style = FULFILLMENT_STYLES[match.state];

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{match.requirement.label}</p>
        {match.bestCourse ? (
          <p className="truncate text-xs text-muted-foreground">{match.bestCourse.course}</p>
        ) : null}
        {match.requirement.notes ? (
          <p className="truncate text-xs text-cyan-200/70">{match.requirement.notes}</p>
        ) : null}
      </div>
      <span
        className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.className}`}
      >
        {style.showPulse ? (
          <span className="relative flex h-1.5 w-1.5 flex-shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
        ) : null}
        {style.label}
      </span>
    </li>
  );
}
