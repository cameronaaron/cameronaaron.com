import { describe, expect, it } from 'vitest';

import type { ProgramPrerequisite } from '@/data/nursingPrograms';
import type { TranscriptCourse } from '@/data/nursingTranscript';
import type { RequirementMatch } from './matching-logic';
import type { PrereqGpaResult } from './gpa-logic';
import { READINESS_BAND_STYLES, READINESS_THRESHOLDS, assessReadiness } from './readiness-logic';

function requirement(): ProgramPrerequisite {
  return { category: 'anatomy', label: 'Human Anatomy' };
}

function match(state: RequirementMatch['state']): RequirementMatch {
  const bestCourse: TranscriptCourse | null =
    state === 'missing'
      ? null
      : {
          category: 'anatomy',
          course: 'Course',
          institution: 'Institution',
          units: 4,
          status: state,
          ...(state === 'completed' ? { grade: 'A', gradePoints: 4.0 } : {}),
        };
  return { requirement: requirement(), state, matchedCourses: bestCourse ? [bestCourse] : [], bestCourse };
}

function gpa(value: number | null): PrereqGpaResult {
  return { qualityPoints: 0, gradedUnits: value === null ? 0 : 1, gpa: value };
}

describe('assessReadiness', () => {
  it('bands as strong at 100% complete with a high GPA', () => {
    const matches = Array.from({ length: 5 }, () => match('completed'));
    const result = assessReadiness(matches, gpa(3.8));
    expect(result.band).toBe('strong');
    expect(result.percentComplete).toBe(100);
    expect(result.rationale).toContain('5/5 prerequisites complete');
    expect(result.rationale).toContain('3.80 prereq GPA');
  });

  it('bands as competitive when complete but below the strong GPA threshold', () => {
    const matches = Array.from({ length: 5 }, () => match('completed'));
    const result = assessReadiness(matches, gpa(READINESS_THRESHOLDS.competitive.minGpa));
    expect(result.band).toBe('competitive');
  });

  it('bands as developing when roughly half complete', () => {
    const matches = [match('completed'), match('completed'), match('missing'), match('missing')];
    const result = assessReadiness(matches, gpa(3.0));
    expect(result.percentComplete).toBe(50);
    expect(result.band).toBe('developing');
  });

  it('bands as early when nothing is complete yet', () => {
    const matches = [match('missing'), match('in-progress')];
    const result = assessReadiness(matches, gpa(null));
    expect(result.band).toBe('early');
    expect(result.rationale).toContain('no graded prerequisites yet');
  });

  it('reports 0% for a program with zero prerequisites rather than dividing by zero', () => {
    const result = assessReadiness([], gpa(null));
    expect(result.percentComplete).toBe(0);
    expect(result.band).toBe('early');
  });
});

describe('READINESS_BAND_STYLES', () => {
  it('pins the exact label and className for every band', () => {
    expect(READINESS_BAND_STYLES.strong).toEqual({
      label: 'Strong',
      className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    });
    expect(READINESS_BAND_STYLES.competitive).toEqual({
      label: 'Competitive',
      className: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
    });
    expect(READINESS_BAND_STYLES.developing).toEqual({
      label: 'Developing',
      className: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
    });
    expect(READINESS_BAND_STYLES.early).toEqual({
      label: 'Early',
      className: 'border-white/15 bg-white/5 text-muted-foreground',
    });
  });
});
