import type { RequirementMatch } from './matching-logic';

export interface PrereqGpaResult {
  qualityPoints: number;
  gradedUnits: number;
  /** Rounded to 2dp; null when nothing graded yet (avoids divide-by-zero). */
  gpa: number | null;
}

const GPA_DECIMALS = 2;

/**
 * Weighted GPA across only the requirements whose counted course is
 * completed and graded — one course per requirement (the `bestCourse`
 * picked by matching-logic), never every transcript course that happens to
 * share a category, so a student who took three developmental-psychology
 * electives isn't averaged in three times for a program that needs one.
 */
export function calculatePrereqGpa(matches: RequirementMatch[]): PrereqGpaResult {
  let qualityPoints = 0;
  let gradedUnits = 0;

  for (const match of matches) {
    const { bestCourse } = match;
    if (match.state !== 'completed' || !bestCourse || bestCourse.gradePoints === undefined) continue;
    qualityPoints += bestCourse.gradePoints * bestCourse.units;
    gradedUnits += bestCourse.units;
  }

  const gpa = gradedUnits === 0 ? null : Math.round((qualityPoints / gradedUnits) * 10 ** GPA_DECIMALS) / 10 ** GPA_DECIMALS;
  return { qualityPoints, gradedUnits, gpa };
}
