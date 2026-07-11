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

    expect(collections.sortedEducationItems[0]?.period).toBe('Sep 2025 - Aug 2026');
    expect(collections.sortedHonorsAndAffiliations[0].label).toContain('(Jun 2026)');
    expect(collections.sortedPrerequisiteCourses.length).toBe(prerequisiteCourses.length);
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
