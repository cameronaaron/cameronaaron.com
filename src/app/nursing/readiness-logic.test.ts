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

  it('treats a null GPA as 0 once percent-complete alone clears a threshold', () => {
    // 100% complete clears every band's minPercent, so with a null GPA this
    // only exercises the `gpa ?? 0` fallback (strong/competitive still fail
    // on GPA; developing's minGpa is 0, so 0 >= 0 lets it land there).
    const matches = Array.from({ length: 5 }, () => match('completed'));
    const result = assessReadiness(matches, gpa(null));
    expect(result.band).toBe('developing');
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
      className: 'border-success/25 bg-success/10 text-success',
    });
    expect(READINESS_BAND_STYLES.competitive).toEqual({
      label: 'Competitive',
      className: 'border-primary/25 bg-primary/10 text-primary',
    });
    expect(READINESS_BAND_STYLES.developing).toEqual({
      label: 'Developing',
      className: 'border-warning/25 bg-warning/10 text-warning',
    });
    expect(READINESS_BAND_STYLES.early).toEqual({
      label: 'Early',
      className: 'border-foreground/15 bg-foreground/5 text-muted-foreground',
    });
  });
});
