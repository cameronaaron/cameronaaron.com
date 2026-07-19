import { describe, expect, it } from 'vitest';

import type { ProgramPrerequisite } from '@/data/nursingPrograms';
import type { TranscriptCourse } from '@/data/nursingTranscript';
import type { RequirementMatch } from './matching-logic';
import { calculatePrereqGpa } from './gpa-logic';

function requirement(overrides: Partial<ProgramPrerequisite> = {}): ProgramPrerequisite {
  return { category: 'anatomy', label: 'Human Anatomy', ...overrides };
}

function completedMatch(units: number, gradePoints: number): RequirementMatch {
  const bestCourse: TranscriptCourse = {
    category: 'anatomy',
    course: 'Course',
    institution: 'Institution',
    units,
    status: 'completed',
    grade: 'A',
    gradePoints,
  };
  return { requirement: requirement(), state: 'completed', matchedCourses: [bestCourse], bestCourse };
}

function missingMatch(): RequirementMatch {
  return { requirement: requirement(), state: 'missing', matchedCourses: [], bestCourse: null };
}

function inProgressMatch(): RequirementMatch {
  const bestCourse: TranscriptCourse = {
    category: 'anatomy',
    course: 'Course',
    institution: 'Institution',
    units: 4,
    status: 'in-progress',
  };
  return { requirement: requirement(), state: 'in-progress', matchedCourses: [bestCourse], bestCourse };
}

describe('calculatePrereqGpa', () => {
  it('returns null gpa and zero units when nothing is completed and graded', () => {
    const result = calculatePrereqGpa([missingMatch(), inProgressMatch()]);
    expect(result).toEqual({ qualityPoints: 0, gradedUnits: 0, gpa: null });
  });

  it('computes weighted quality-points / units for a single completed course', () => {
    const result = calculatePrereqGpa([completedMatch(4, 4.0)]);
    expect(result.qualityPoints).toBe(16);
    expect(result.gradedUnits).toBe(4);
    expect(result.gpa).toBe(4.0);
  });

  it('weights multiple completed courses by units', () => {
    // 4 units @ 4.0 + 3 units @ 2.0 = 16 + 6 = 22 quality points / 7 units = 3.142857... -> 3.14
    const result = calculatePrereqGpa([completedMatch(4, 4.0), completedMatch(3, 2.0)]);
    expect(result.qualityPoints).toBe(22);
    expect(result.gradedUnits).toBe(7);
    expect(result.gpa).toBe(3.14);
  });

  it('excludes in-progress and missing requirements from the calculation', () => {
    const result = calculatePrereqGpa([completedMatch(4, 4.0), inProgressMatch(), missingMatch()]);
    expect(result.gradedUnits).toBe(4);
    expect(result.gpa).toBe(4.0);
  });

  it('excludes a completed requirement whose bestCourse has no numeric grade (e.g. Pass/No-grade)', () => {
    const bestCourse: TranscriptCourse = {
      category: 'anatomy',
      course: 'Pass-only course',
      institution: 'Institution',
      units: 4,
      status: 'completed',
      grade: 'P',
    };
    const match: RequirementMatch = { requirement: requirement(), state: 'completed', matchedCourses: [bestCourse], bestCourse };
    const result = calculatePrereqGpa([completedMatch(4, 4.0), match]);
    expect(result.gradedUnits).toBe(4);
    expect(result.gpa).toBe(4.0);
  });

  it('excludes a non-completed requirement even if its bestCourse happens to carry gradePoints', () => {
    // Defensive case: matchRequirement never actually produces this
    // combination in practice (a non-completed state only arises when no
    // completed course was matched), but calculatePrereqGpa must gate on
    // `state`, not merely on whether gradePoints is present.
    const bestCourse: TranscriptCourse = {
      category: 'anatomy',
      course: 'Should not count',
      institution: 'Institution',
      units: 10,
      status: 'in-progress',
      gradePoints: 4.0,
    };
    const match: RequirementMatch = { requirement: requirement(), state: 'in-progress', matchedCourses: [bestCourse], bestCourse };
    const result = calculatePrereqGpa([completedMatch(4, 4.0), match]);
    expect(result.gradedUnits).toBe(4);
    expect(result.gpa).toBe(4.0);
  });

  it('skips (does not throw) a completed match whose bestCourse is somehow null', () => {
    const match: RequirementMatch = { requirement: requirement(), state: 'completed', matchedCourses: [], bestCourse: null };
    expect(() => calculatePrereqGpa([completedMatch(4, 4.0), match])).not.toThrow();
    const result = calculatePrereqGpa([completedMatch(4, 4.0), match]);
    expect(result.gradedUnits).toBe(4);
  });
});
