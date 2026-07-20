import { sortByDateDesc } from '@/data/dateOrdering';
import type { EducationItem, EducationVerificationLink, HonorItem, PrerequisiteCourse } from '@/data/education';

const NON_FINALIZED_STATUS_TOKENS = [
  'in progress',
  'planned',
  'pending',
  'tbd',
  'enrolled',
  'not started',
] as const;

export interface SortedPrerequisiteCourse extends PrerequisiteCourse {
  /** Precomputed once during sorting so render paths never rescan status tokens. */
  nonFinalized: boolean;
}

export interface SortedEducationItem extends EducationItem {
  /** Precomputed once at build — verificationLinks[1..] render as pill links,
   *  so the render path never re-slices per render. */
  pillLinks: EducationVerificationLink[];
}

export interface PrerequisiteProgress {
  completed: number;
  total: number;
  /** 0-100, rounded — the width the progress bar animates to. */
  percent: number;
}

export interface EducationCollections {
  sortedEducationItems: SortedEducationItem[];
  sortedHonorsAndAffiliations: HonorItem[];
  sortedPrerequisiteCourses: SortedPrerequisiteCourse[];
  prerequisiteProgress: PrerequisiteProgress;
}

const EMPTY_PILL_LINKS: EducationVerificationLink[] = [];

export function isNonFinalizedCourseStatus(status: string): boolean {
  // Stryker disable next-line MethodExpression: the match below is
  // `.includes(token)` (unanchored substring search), never an exact-equality
  // or start/end-anchored check, so leading/trailing whitespace on the full
  // string can never prevent a token from being found — trim() has no
  // observable effect on this function's return value for any input. Hand-
  // verified: removing `.trim()` here leaves the full education suite
  // (including a padded-whitespace input case) passing unchanged.
  const normalized = status.trim().toLowerCase();

  return NON_FINALIZED_STATUS_TOKENS.some((token) => normalized.includes(token));
}

export function formatGradeDisplay(grade: string, gpa?: string): string {
  if (!gpa) return grade;
  return `${grade} (${gpa})`;
}

export function sortPrerequisiteCourses(courses: PrerequisiteCourse[]): SortedPrerequisiteCourse[] {
  // Decorate-sort-undecorate: the status token scan runs once per course,
  // not once per comparison inside the sort.
  const decorated = courses.map((course) => ({
    course,
    nonFinalized: Number(isNonFinalizedCourseStatus(course.status)),
  }));

  decorated.sort((left, right) => {
    const bucketDiff = left.nonFinalized - right.nonFinalized;
    if (bucketDiff !== 0) return bucketDiff;

    const requirementDiff = left.course.requirement.localeCompare(right.course.requirement);
    if (requirementDiff !== 0) return requirementDiff;

    return left.course.course.localeCompare(right.course.course);
  });

  // Keep the flag on the sorted item so consumers read a boolean instead of
  // re-running the token scan per row per render.
  return decorated.map((entry) => ({ ...entry.course, nonFinalized: entry.nonFinalized === 1 }));
}

function decorateEducationItems(items: EducationItem[]): SortedEducationItem[] {
  const decorated: SortedEducationItem[] = [];
  for (const item of items) {
    decorated.push({
      ...item,
      pillLinks:
        item.verificationLinks && item.verificationLinks.length > 1
          ? item.verificationLinks.slice(1)
          : EMPTY_PILL_LINKS,
    });
  }
  return decorated;
}

/**
 * Completed/total prerequisite counts, single pass over the already-decorated
 * list (reuses each course's precomputed `nonFinalized` flag rather than
 * re-scanning status text). A course with zero total courses reports 0%
 * rather than dividing by zero.
 */
export function calculatePrerequisiteProgress(courses: SortedPrerequisiteCourse[]): PrerequisiteProgress {
  let completed = 0;
  for (const course of courses) {
    if (!course.nonFinalized) completed += 1;
  }
  const total = courses.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function buildEducationCollections(
  educationItems: EducationItem[],
  prerequisiteCourses: PrerequisiteCourse[],
  honorsAndAffiliations: HonorItem[]
): EducationCollections {
  const sortedPrerequisiteCourses = sortPrerequisiteCourses(prerequisiteCourses);
  return {
    sortedEducationItems: decorateEducationItems(sortByDateDesc(educationItems, (item) => item.period)),
    sortedHonorsAndAffiliations: sortByDateDesc(honorsAndAffiliations, (item) => item.label),
    sortedPrerequisiteCourses,
    prerequisiteProgress: calculatePrerequisiteProgress(sortedPrerequisiteCourses),
  };
}
