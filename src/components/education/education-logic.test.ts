import { describe, expect, it } from 'vitest';
import { educationItems, honorsAndAffiliations, prerequisiteCourses } from '@/data/education';
import type { PrerequisiteCourse } from '@/data/education';
import {
  buildEducationCollections,
  calculatePrerequisiteProgress,
  formatGradeDisplay,
  isNonFinalizedCourseStatus,
  sortPrerequisiteCourses,
} from '@/components/education/education-logic';

function makeCourse(overrides: Partial<PrerequisiteCourse>): PrerequisiteCourse {
  return { requirement: 'Req', course: 'Course', units: '3', grade: 'A', status: 'Completed', ...overrides };
}

describe('education logic', () => {
  it('detects non-finalized course statuses from known keywords', () => {
    expect(isNonFinalizedCourseStatus('In Progress')).toBe(true);
    expect(isNonFinalizedCourseStatus('planned for next term')).toBe(true);
    expect(isNonFinalizedCourseStatus('Completed')).toBe(false);
  });

  it('tolerates surrounding whitespace in the status text', () => {
    // Note: `.includes()` is a substring search, so this passes even without
    // the `.trim()` call in the source — see the Stryker-disable comment on
    // that line for why trim() itself is a confirmed-equivalent no-op here.
    // Kept as a behavioral pin on padded input, not a mutation-kill test.
    expect(isNonFinalizedCourseStatus('  In Progress  ')).toBe(true);
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

  it('breaks a same-bucket tie by requirement, not by leaving input order untouched', () => {
    // Both courses are non-finalized (same bucket=1), so bucketDiff is a true
    // tie (0) — this is the only case where `-` and `+` on two 1s actually
    // diverge (0 vs 2), and the only case that reaches the requirement
    // tie-break at all. Course names are chosen to sort the OPPOSITE way
    // from requirement, so a mutant that skips the requirement check
    // entirely (falling through to compare course names instead) produces a
    // detectably different, wrong order.
    const courses = [
      makeCourse({ requirement: 'Zoology', course: 'AAA', status: 'In Progress' }),
      makeCourse({ requirement: 'Anatomy', course: 'ZZZ', status: 'In Progress' }),
    ];
    const sorted = sortPrerequisiteCourses(courses);
    expect(sorted.map((c) => c.requirement)).toEqual(['Anatomy', 'Zoology']);
  });

  it('breaks a same-bucket, same-requirement tie by course name', () => {
    const courses = [
      makeCourse({ requirement: 'Bio', course: 'Zed', status: 'In Progress' }),
      makeCourse({ requirement: 'Bio', course: 'Alpha', status: 'In Progress' }),
    ];
    const sorted = sortPrerequisiteCourses(courses);
    expect(sorted.map((c) => c.course)).toEqual(['Alpha', 'Zed']);
  });

  it('builds all sorted education collections used by the component', () => {
    const collections = buildEducationCollections(educationItems, prerequisiteCourses, honorsAndAffiliations);

    expect(collections.sortedEducationItems[0]?.period).toBe('Sep 2025 - Aug 2026');
    expect(collections.sortedHonorsAndAffiliations[0].label).toContain('(Jun 2026)');
    expect(collections.sortedPrerequisiteCourses.length).toBe(prerequisiteCourses.length);
  });

  it('actually sorts education items by period, not just by preserving input order', () => {
    // The real fixture data above is already stored newest-first, so a
    // mutant that swaps the `item.period` key selector for a constant
    // (`() => undefined`) would tie every item and a stable sort would
    // silently preserve that already-correct order — masking the bug. Feed
    // items in the WRONG (oldest-first) order so only a real key-based sort
    // produces the expected (newest-first) result.
    const oldestFirst = [
      { institution: 'Old College', credential: 'Cert', period: 'Jan 2010', details: [] },
      { institution: 'New University', credential: 'Degree', period: 'Jan 2024', details: [] },
    ];
    const collections = buildEducationCollections(oldestFirst, [], []);
    expect(collections.sortedEducationItems.map((i) => i.institution)).toEqual(['New University', 'Old College']);
  });

  it('actually sorts honors/affiliations by the date in their label, not input order', () => {
    const oldestFirst = [
      { label: 'Older Award (Jan 2010)' },
      { label: 'Newer Award (Jan 2024)' },
    ];
    const collections = buildEducationCollections([], [], oldestFirst);
    expect(collections.sortedHonorsAndAffiliations.map((h) => h.label)).toEqual([
      'Newer Award (Jan 2024)',
      'Older Award (Jan 2010)',
    ]);
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
