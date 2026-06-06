import { sortByDateDesc } from '@/data/dateOrdering';
import type { EducationItem, PrerequisiteCourse } from '@/data/education';

const NON_FINALIZED_STATUS_TOKENS = [
  'in progress',
  'planned',
  'pending',
  'tbd',
  'enrolled',
  'not started',
] as const;

export interface EducationCollections {
  sortedEducationItems: EducationItem[];
  sortedHonorsAndAffiliations: string[];
  sortedPrerequisiteCourses: PrerequisiteCourse[];
}

export function isNonFinalizedCourseStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  return NON_FINALIZED_STATUS_TOKENS.some((token) => normalized.includes(token));
}

export function formatGradeDisplay(grade: string, gpa?: string): string {
  if (!gpa) return grade;
  return `${grade} (${gpa})`;
}

export function sortPrerequisiteCourses(courses: PrerequisiteCourse[]): PrerequisiteCourse[] {
  return [...courses].sort((left, right) => {
    const bucketDiff = Number(isNonFinalizedCourseStatus(left.status)) - Number(isNonFinalizedCourseStatus(right.status));
    if (bucketDiff !== 0) return bucketDiff;

    const requirementDiff = left.requirement.localeCompare(right.requirement);
    if (requirementDiff !== 0) return requirementDiff;

    return left.course.localeCompare(right.course);
  });
}

export function buildEducationCollections(
  educationItems: EducationItem[],
  prerequisiteCourses: PrerequisiteCourse[],
  honorsAndAffiliations: string[]
): EducationCollections {
  return {
    sortedEducationItems: sortByDateDesc(educationItems, (item) => item.period),
    sortedHonorsAndAffiliations: sortByDateDesc(honorsAndAffiliations, (item) => item),
    sortedPrerequisiteCourses: sortPrerequisiteCourses(prerequisiteCourses),
  };
}
