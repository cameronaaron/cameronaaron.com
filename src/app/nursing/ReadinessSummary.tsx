import { READINESS_BAND_STYLES, type ReadinessAssessment } from './readiness-logic';

interface ReadinessSummaryProps {
  readiness: ReadinessAssessment;
}

export default function ReadinessSummary({ readiness }: ReadinessSummaryProps) {
  const style = READINESS_BAND_STYLES[readiness.band];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style.className}`}>
          {style.label} readiness
        </span>
        <span className="text-xs font-medium text-cyan-200/80">{readiness.percentComplete}% complete</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{readiness.rationale}</p>
    </div>
  );
}
