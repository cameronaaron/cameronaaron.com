import { describe, expect, it } from 'vitest';
import { educationItems, honorsAndAffiliations, prerequisiteCourses } from '@/data/education';
import {
  buildEducationCollections,
  calculatePrerequisiteProgress,
  formatGradeDisplay,
  isNonFinalizedCourseStatus,
  sortPrerequisiteCourses,
} from '@/components/education/logic';

describe('education logic', () => {
  it('detects non-finalized course statuses from known keywords', () => {
    expect(isNonFinalizedCourseStatus('In Progress')).toBe(true);
    expect(isNonFinalizedCourseStatus('planned for next term')).toBe(true);
    expect(isNonFinalizedCourseStatus('Completed')).toBe(false);
  });

  it('formats grade display with optional GPA', () => {
    expect(formatGradeDisplay('A')).toBe('A');
    expect(formatGradeDisplay('A', '4.00')).toBe('A (4.00)');
  });

  it('sorts prerequisite courses with finalized entries first', () => {
    const sorted = sortPrerequisiteCourses(prerequisiteCourses);

    const firstNonFinalizedIndex = sorted.findIndex((course) => isNonFinalizedCourseStatus(course.status));
    expect(firstNonFinalizedIndex).toBeGreaterThan(0);
    expect(sorted.slice(firstNonFinalizedIndex).every((course) => isNonFinalizedCourseStatus(course.status))).toBe(true);
  });

  it('builds all sorted education collections used by the component', () => {
    const collections = buildEducationCollections(educationItems, prerequisiteCourses, honorsAndAffiliations);

    expect(collections.sortedEducationItems[0]?.period).toBe('Sep 2025 - Aug 2026');
    expect(collections.sortedHonorsAndAffiliations[0].label).toContain('(Jun 2026)');
    expect(collections.sortedPrerequisiteCourses.length).toBe(prerequisiteCourses.length);
  });

  describe('calculatePrerequisiteProgress', () => {
    it('counts finalized (non-in-progress) courses as completed', () => {
      const sorted = sortPrerequisiteCourses(prerequisiteCourses);
      const expectedCompleted = sorted.filter((c) => !c.nonFinalized).length;

      const progress = calculatePrerequisiteProgress(sorted);

      expect(progress.completed).toBe(expectedCompleted);
      expect(progress.total).toBe(prerequisiteCourses.length);
    });

    it('rounds percent to the nearest whole number', () => {
      const courses = [
        { requirement: 'A', course: 'A1', units: '3', grade: 'A', status: 'Completed', nonFinalized: false },
        { requirement: 'B', course: 'B1', units: '3', grade: 'B', status: 'Completed', nonFinalized: false },
        { requirement: 'C', course: 'C1', units: '3', grade: '', status: 'In Progress', nonFinalized: true },
      ];
      // 2 of 3 complete = 66.67%, rounds to 67.
      expect(calculatePrerequisiteProgress(courses)).toEqual({ completed: 2, total: 3, percent: 67 });
    });

    it('reports 0% (not NaN) for an empty course list', () => {
      expect(calculatePrerequisiteProgress([])).toEqual({ completed: 0, total: 0, percent: 0 });
    });

    it('reports 100% when every course is finalized', () => {
      const courses = [
        { requirement: 'A', course: 'A1', units: '3', grade: 'A', status: 'Completed', nonFinalized: false },
      ];
      expect(calculatePrerequisiteProgress(courses)).toEqual({ completed: 1, total: 1, percent: 100 });
    });

    it('is included in buildEducationCollections output, computed from the sorted list', () => {
      const collections = buildEducationCollections(educationItems, prerequisiteCourses, honorsAndAffiliations);
      expect(collections.prerequisiteProgress).toEqual(
        calculatePrerequisiteProgress(collections.sortedPrerequisiteCourses)
      );
    });
  });

  it('precomputes pill links (verificationLinks[1..]) once per item at build', () => {
    const withPills = {
      institution: 'A', credential: 'B', period: 'Jan 2024', details: [],
      verificationLinks: [
        { label: 'Site', url: 'https://a.example' },
        { label: 'Credential', url: 'https://b.example' },
      ],
    };
    const withoutPills = {
      institution: 'C', credential: 'D', period: 'Jan 2023', details: [],
      verificationLinks: [{ label: 'Site', url: 'https://c.example' }],
    };

    const collections = buildEducationCollections([withPills, withoutPills], [], []);

    expect(collections.sortedEducationItems[0].pillLinks).toEqual([
      { label: 'Credential', url: 'https://b.example' },
    ]);
    // Items with ≤1 link share one module-level empty array — zero allocation.
    expect(collections.sortedEducationItems[1].pillLinks).toHaveLength(0);
    const again = buildEducationCollections([withoutPills], [], []);
    expect(again.sortedEducationItems[0].pillLinks).toBe(collections.sortedEducationItems[1].pillLinks);
  });
});
