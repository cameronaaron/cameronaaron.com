import { describe, expect, it } from 'vitest';

import type { NursingProgram, ProgramPrerequisite } from '@/data/nursingPrograms';
import type { TranscriptCourse } from '@/data/nursingTranscript';
import {
  FULFILLMENT_STYLES,
  buildTranscriptIndex,
  matchProgramRequirements,
  matchRequirement,
} from './matching-logic';

function course(overrides: Partial<TranscriptCourse>): TranscriptCourse {
  return {
    category: 'anatomy',
    course: 'Course',
    institution: 'Institution',
    units: 4,
    status: 'completed',
    grade: 'A',
    gradePoints: 4.0,
    ...overrides,
  };
}

function requirement(overrides: Partial<ProgramPrerequisite>): ProgramPrerequisite {
  return { category: 'anatomy', label: 'Human Anatomy', ...overrides };
}

describe('buildTranscriptIndex', () => {
  it('buckets courses by category', () => {
    const index = buildTranscriptIndex([
      course({ category: 'anatomy', course: 'A1' }),
      course({ category: 'microbiology', course: 'M1' }),
      course({ category: 'anatomy', course: 'A2' }),
    ]);

    expect(index.get('anatomy')?.map((c) => c.course)).toEqual(['A1', 'A2']);
    expect(index.get('microbiology')?.map((c) => c.course)).toEqual(['M1']);
    expect(index.get('nutrition')).toBeUndefined();
  });
});

describe('matchRequirement — fulfillment state', () => {
  it('is completed when at least one matched course is completed', () => {
    const index = buildTranscriptIndex([course({ category: 'anatomy', status: 'completed' })]);
    const match = matchRequirement(requirement({}), index);
    expect(match.state).toBe('completed');
  });

  it('is in-progress when nothing is completed but something is in progress', () => {
    const index = buildTranscriptIndex([
      course({ category: 'anatomy', status: 'in-progress', gradePoints: undefined, grade: undefined }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.state).toBe('in-progress');
  });

  it('is missing when no transcript course matches the category', () => {
    const index = buildTranscriptIndex([]);
    const match = matchRequirement(requirement({}), index);
    expect(match.state).toBe('missing');
    expect(match.matchedCourses).toEqual([]);
    expect(match.bestCourse).toBeNull();
  });

  it('is missing when the only matched course is merely planned, not started or in progress', () => {
    const index = buildTranscriptIndex([
      course({ category: 'anatomy', status: 'planned', gradePoints: undefined, grade: undefined }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.state).toBe('missing');
  });

  it('completed wins over in-progress when both exist for the same category', () => {
    const index = buildTranscriptIndex([
      course({ category: 'anatomy', course: 'in-progress-attempt', status: 'in-progress', gradePoints: undefined, grade: undefined }),
      course({ category: 'anatomy', course: 'completed-attempt', status: 'completed', gradePoints: 3.0 }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.state).toBe('completed');
  });
});

describe('matchRequirement — bestCourse selection', () => {
  it('is null when there are no matched courses', () => {
    const match = matchRequirement(requirement({}), buildTranscriptIndex([]));
    expect(match.bestCourse).toBeNull();
  });

  it('is the single completed, graded course when only one is matched', () => {
    const index = buildTranscriptIndex([course({ course: 'only', status: 'completed', gradePoints: 4.0 })]);
    const match = matchRequirement(requirement({}), index);
    expect(match.bestCourse?.course).toBe('only');
  });

  it('is the in-progress course when nothing is completed', () => {
    const index = buildTranscriptIndex([
      course({ course: 'in-progress', status: 'in-progress', gradePoints: undefined, grade: undefined }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.bestCourse?.course).toBe('in-progress');
  });

  it('is the completed course even without a numeric grade, when nothing else is matched', () => {
    const index = buildTranscriptIndex([
      course({ course: 'pass-no-grade', status: 'completed', gradePoints: undefined, grade: 'P' }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.bestCourse?.course).toBe('pass-no-grade');
  });

  it('picks the higher-graded completed course when the higher one is listed first', () => {
    const index = buildTranscriptIndex([
      course({ course: 'higher', status: 'completed', gradePoints: 4.0 }),
      course({ course: 'lower', status: 'completed', gradePoints: 3.0 }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.bestCourse?.course).toBe('higher');
  });

  it('picks the higher-graded completed course when the higher one is listed second', () => {
    const index = buildTranscriptIndex([
      course({ course: 'lower', status: 'completed', gradePoints: 3.0 }),
      course({ course: 'higher', status: 'completed', gradePoints: 4.0 }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.bestCourse?.course).toBe('higher');
  });

  it('keeps the earlier-listed completed course on an exact gradePoints tie', () => {
    const index = buildTranscriptIndex([
      course({ course: 'first', status: 'completed', gradePoints: 4.0 }),
      course({ course: 'second-tied', status: 'completed', gradePoints: 4.0 }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.bestCourse?.course).toBe('first');
  });

  it('never lets a non-completed course with an incidentally high gradePoints outrank an actual completed course', () => {
    const index = buildTranscriptIndex([
      // Unusual but type-valid: an in-progress course that happens to carry
      // a gradePoints value. Its status alone must disqualify it.
      course({ course: 'in-progress-high-grade', status: 'in-progress', gradePoints: 5.0 }),
      course({ course: 'actually-completed', status: 'completed', gradePoints: 3.0 }),
    ]);
    const match = matchRequirement(requirement({}), index);
    expect(match.bestCourse?.course).toBe('actually-completed');
  });

  it('prefers a graded completed course over an in-progress one, regardless of order', () => {
    const gradedFirst = buildTranscriptIndex([
      course({ course: 'graded', status: 'completed', gradePoints: 3.0 }),
      course({ course: 'in-progress', status: 'in-progress', gradePoints: undefined, grade: undefined }),
    ]);
    expect(matchRequirement(requirement({}), gradedFirst).bestCourse?.course).toBe('graded');

    const gradedSecond = buildTranscriptIndex([
      course({ course: 'in-progress', status: 'in-progress', gradePoints: undefined, grade: undefined }),
      course({ course: 'graded', status: 'completed', gradePoints: 3.0 }),
    ]);
    expect(matchRequirement(requirement({}), gradedSecond).bestCourse?.course).toBe('graded');
  });
});

describe('matchProgramRequirements', () => {
  it('maps every program prerequisite to a match, preserving order', () => {
    const program: NursingProgram = {
      id: 'test',
      institution: 'Test U',
      programName: 'Test Program',
      city: 'Test City',
      degreeType: 'accelerated-bsn',
      requiresChemistry: false,
      prerequisites: [requirement({ category: 'anatomy' }), requirement({ category: 'microbiology' })],
      applicationWindows: [],
      sourceUrls: ['https://example.edu/'],
    };
    const index = buildTranscriptIndex([course({ category: 'anatomy' })]);

    const matches = matchProgramRequirements(program, index);
    expect(matches).toHaveLength(2);
    expect(matches[0].state).toBe('completed');
    expect(matches[1].state).toBe('missing');
  });
});

describe('FULFILLMENT_STYLES', () => {
  it('pins the exact label and className for each state', () => {
    expect(FULFILLMENT_STYLES.completed).toEqual({
      label: 'Completed',
      className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
      showPulse: false,
    });
    expect(FULFILLMENT_STYLES['in-progress']).toEqual({
      label: 'In progress',
      className: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
      showPulse: true,
    });
    expect(FULFILLMENT_STYLES.missing).toEqual({
      label: 'Not started',
      className: 'border-white/15 bg-white/5 text-muted-foreground',
      showPulse: false,
    });
  });
});
