import { describe, expect, it } from 'vitest';
import { educationItems, honorsAndAffiliations, prerequisiteCourses } from '@/data/education';
import {
  buildEducationCollections,
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

    expect(collections.sortedEducationItems[0]?.period).toBe('May 2023 - Jun 2026');
    expect(collections.sortedHonorsAndAffiliations[0]).toContain('(Jun 2025)');
    expect(collections.sortedPrerequisiteCourses.length).toBe(prerequisiteCourses.length);
  });
});
