import type { PrereqGpaResult } from './gpa-logic';
import type { RequirementMatch } from './matching-logic';

export type ReadinessBand = 'strong' | 'competitive' | 'developing' | 'early';

export interface ReadinessAssessment {
  band: ReadinessBand;
  percentComplete: number;
  completedCount: number;
  totalCount: number;
  prereqGpa: number | null;
  rationale: string;
}

/**
 * Named, documented thresholds for a transparent self-assessment — NOT a
 * prediction of admission odds. There is no reliable per-program
 * acceptance-rate data to model real odds against, so this only reflects
 * how complete and how strong Cameron's own prerequisite record is,
 * expressed as a plain-language rationale the UI shows verbatim.
 */
export const READINESS_THRESHOLDS: Record<Exclude<ReadinessBand, 'early'>, { minPercent: number; minGpa: number }> = {
  strong: { minPercent: 100, minGpa: 3.5 },
  competitive: { minPercent: 80, minGpa: 3.2 },
  developing: { minPercent: 50, minGpa: 0 },
};

const BAND_ORDER: Exclude<ReadinessBand, 'early'>[] = ['strong', 'competitive', 'developing'];

export const READINESS_BAND_STYLES: Record<ReadinessBand, { label: string; className: string }> = {
  strong: { label: 'Strong', className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200' },
  competitive: { label: 'Competitive', className: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200' },
  developing: { label: 'Developing', className: 'border-amber-400/25 bg-amber-500/10 text-amber-200' },
  early: { label: 'Early', className: 'border-white/15 bg-white/5 text-muted-foreground' },
};

function pickBand(percentComplete: number, gpa: number | null): ReadinessBand {
  for (const band of BAND_ORDER) {
    const threshold = READINESS_THRESHOLDS[band];
    if (percentComplete >= threshold.minPercent && (gpa ?? 0) >= threshold.minGpa) {
      return band;
    }
  }
  return 'early';
}

export function assessReadiness(matches: RequirementMatch[], gpaResult: PrereqGpaResult): ReadinessAssessment {
  const totalCount = matches.length;
  let completedCount = 0;
  for (const match of matches) {
    if (match.state === 'completed') completedCount += 1;
  }
  const percentComplete = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const band = pickBand(percentComplete, gpaResult.gpa);

  const gpaText = gpaResult.gpa === null ? 'no graded prerequisites yet' : `${gpaResult.gpa.toFixed(2)} prereq GPA`;
  const rationale = `${completedCount}/${totalCount} prerequisites complete, ${gpaText}.`;

  return { band, percentComplete, completedCount, totalCount, prereqGpa: gpaResult.gpa, rationale };
}
