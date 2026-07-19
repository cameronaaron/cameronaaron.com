import type { DegreeType } from '@/data/nursingPrograms';
import type { RequirementMatch } from './matching-logic';

export const DEGREE_TYPE_LABELS: Record<DegreeType, string> = {
  'accelerated-bsn': 'Accelerated BSN',
  'second-degree-bsn': 'Second-Degree BSN',
  'elm-msn': 'Entry-Level Master’s (ELM)',
  mecn: 'Master’s Entry Clinical Nursing (MECN)',
};

export interface ChemistryBadge {
  label: string;
  className: string;
}

export function getChemistryBadge(requiresChemistry: boolean): ChemistryBadge {
  return requiresChemistry
    ? { label: 'Chemistry required', className: 'border-amber-400/25 bg-amber-500/10 text-amber-200' }
    : { label: 'No chemistry required', className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200' };
}

/** Completed-count / total-count for the small "x/y" badge on a program card. */
export function getProgramProgressCount(matches: RequirementMatch[]): { completed: number; total: number } {
  let completed = 0;
  for (const match of matches) {
    if (match.state === 'completed') completed += 1;
  }
  return { completed, total: matches.length };
}
