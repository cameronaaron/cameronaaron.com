import { sortByDateDesc } from '@/data/dateOrdering';
import type { EducationItem, HonorItem, PrerequisiteCourse } from '@/data/education';

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

export interface EducationCollections {
  sortedEducationItems: EducationItem[];
  sortedHonorsAndAffiliations: HonorItem[];
  sortedPrerequisiteCourses: SortedPrerequisiteCourse[];
}

export function isNonFinalizedCourseStatus(status: string): boolean {
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

export function buildEducationCollections(
  educationItems: EducationItem[],
  prerequisiteCourses: PrerequisiteCourse[],
  honorsAndAffiliations: HonorItem[]
): EducationCollections {
  return {
    sortedEducationItems: sortByDateDesc(educationItems, (item) => item.period),
    sortedHonorsAndAffiliations: sortByDateDesc(honorsAndAffiliations, (item) => item.label),
    sortedPrerequisiteCourses: sortPrerequisiteCourses(prerequisiteCourses),
  };
}
