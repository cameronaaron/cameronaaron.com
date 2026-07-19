import { describe, expect, it } from 'vitest';

import type { DegreeType } from '@/data/nursingPrograms';
import type { RequirementMatch } from './matching-logic';
import { DEGREE_TYPE_LABELS, getChemistryBadge, getProgramProgressCount } from './program-card-logic';

function match(state: RequirementMatch['state']): RequirementMatch {
  return { requirement: { category: 'anatomy', label: 'Anatomy' }, state, matchedCourses: [], bestCourse: null };
}

describe('DEGREE_TYPE_LABELS', () => {
  it('has a human-readable label for every degree type', () => {
    const types: DegreeType[] = ['accelerated-bsn', 'second-degree-bsn', 'elm-msn', 'mecn'];
    for (const type of types) {
      expect(DEGREE_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

describe('getChemistryBadge', () => {
  it('flags chemistry-required programs with the exact label and className', () => {
    expect(getChemistryBadge(true)).toEqual({
      label: 'Chemistry required',
      className: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
    });
  });

  it('flags no-chemistry programs with the exact label and className', () => {
    expect(getChemistryBadge(false)).toEqual({
      label: 'No chemistry required',
      className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    });
  });
});

describe('getProgramProgressCount', () => {
  it('counts only completed matches, out of the total (asymmetric mix so the count cannot coincidentally match the inverse)', () => {
    const result = getProgramProgressCount([
      match('completed'),
      match('completed'),
      match('completed'),
      match('missing'),
    ]);
    expect(result).toEqual({ completed: 3, total: 4 });
  });

  it('counts zero completed out of a non-empty total when nothing is completed', () => {
    expect(getProgramProgressCount([match('missing'), match('in-progress')])).toEqual({ completed: 0, total: 2 });
  });

  it('returns zero of zero for a program with no prerequisites', () => {
    expect(getProgramProgressCount([])).toEqual({ completed: 0, total: 0 });
  });
});
