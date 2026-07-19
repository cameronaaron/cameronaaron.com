import type { ProgramPrerequisite, NursingProgram, RequirementCategory } from '@/data/nursingPrograms';
import type { TranscriptCourse } from '@/data/nursingTranscript';

export type FulfillmentState = 'completed' | 'in-progress' | 'missing';

export interface RequirementMatch {
  requirement: ProgramPrerequisite;
  state: FulfillmentState;
  matchedCourses: TranscriptCourse[];
  /** The single course counted toward this requirement for display/GPA
   *  purposes — the highest-graded completed match, or the in-progress
   *  match when nothing is completed yet. */
  bestCourse: TranscriptCourse | null;
}

/** Buckets transcript courses by category once (O(n)) so every requirement
 *  lookup afterward is O(1) instead of an O(n) scan per requirement. */
export function buildTranscriptIndex(courses: TranscriptCourse[]): Map<RequirementCategory, TranscriptCourse[]> {
  const index = new Map<RequirementCategory, TranscriptCourse[]>();
  for (const course of courses) {
    const bucket = index.get(course.category);
    if (bucket) {
      bucket.push(course);
    } else {
      index.set(course.category, [course]);
    }
  }
  return index;
}

/** The highest-graded completed course, if any; otherwise the first
 *  matched course (in-progress or ungraded) as a fallback for display. Two
 *  independent, single-pass concerns instead of one branch deciding both
 *  "does this beat the current best" and "is there a best at all" mid-loop. */
function pickBestCourse(matches: TranscriptCourse[]): TranscriptCourse | null {
  if (matches.length === 0) return null;

  let bestGraded: TranscriptCourse | null = null;
  let bestGradePoints = -Infinity;
  for (const course of matches) {
    // Stryker disable next-line ConditionalExpression: `!== undefined` here
    // is required for TypeScript to narrow gradePoints to `number` for the
    // assignment below, but at runtime it's provably redundant — JS's `>`
    // returns false whenever either operand is `undefined`, so
    // `course.gradePoints > bestGradePoints` alone already excludes an
    // ungraded course with no help from this check. See
    // ENGINEERING-STANDARDS.md §6 item 13 for the verification protocol.
    if (course.status === 'completed' && course.gradePoints !== undefined && course.gradePoints > bestGradePoints) {
      bestGraded = course;
      bestGradePoints = course.gradePoints;
    }
  }
  return bestGraded ?? matches[0];
}

export function matchRequirement(
  requirement: ProgramPrerequisite,
  index: Map<RequirementCategory, TranscriptCourse[]>
): RequirementMatch {
  const matchedCourses = index.get(requirement.category) ?? [];

  let state: FulfillmentState = 'missing';
  let hasInProgress = false;
  for (const course of matchedCourses) {
    if (course.status === 'completed') {
      state = 'completed';
      break;
    }
    if (course.status === 'in-progress') {
      hasInProgress = true;
    }
  }
  if (state !== 'completed' && hasInProgress) {
    state = 'in-progress';
  }

  return { requirement, state, matchedCourses, bestCourse: pickBestCourse(matchedCourses) };
}

export function matchProgramRequirements(
  program: NursingProgram,
  index: Map<RequirementCategory, TranscriptCourse[]>
): RequirementMatch[] {
  return program.prerequisites.map((requirement) => matchRequirement(requirement, index));
}

export const FULFILLMENT_STYLES: Record<
  FulfillmentState,
  { label: string; className: string; showPulse: boolean }
> = {
  completed: {
    label: 'Completed',
    className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    showPulse: false,
  },
  'in-progress': {
    label: 'In progress',
    className: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
    showPulse: true,
  },
  missing: {
    label: 'Not started',
    className: 'border-white/15 bg-white/5 text-muted-foreground',
    showPulse: false,
  },
};
