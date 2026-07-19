import type { RequirementCategory } from './nursingPrograms';

export type CourseStatus = 'completed' | 'in-progress' | 'planned';

export interface TranscriptCourse {
  category: RequirementCategory;
  course: string;
  institution: string;
  units: number;
  grade?: string;
  /** Numeric grade points (e.g. 4.0 for an A), omitted while a course is in progress. */
  gradePoints?: number;
  status: CourseStatus;
  hasLab?: boolean;
}

/**
 * Cameron's actual coursework, sourced from College_data/LAC_SR_TSRPT (LACCD
 * unofficial transcript, printed Jul 2026) and the Connecticut College /
 * UMass Amherst transcripts. Each course is tagged with the generic
 * requirement category it satisfies so it can be matched against any
 * program's prerequisite list (see matching-logic.ts). Courses that don't
 * map cleanly to a nursing-prerequisite category (electives, withdrawals,
 * CNA/CHW certificates) are intentionally omitted — this is a prerequisite
 * checklist, not a full transcript.
 */
export const transcriptCourses: TranscriptCourse[] = [
  {
    category: 'anatomy',
    course: 'ANATOMY 001 — Intro to Human Anatomy (LACC)',
    institution: 'Los Angeles City College',
    units: 4,
    grade: 'A',
    gradePoints: 4.0,
    status: 'completed',
    hasLab: true,
  },
  {
    category: 'microbiology',
    course: 'MICRO 020 — General Microbiology (LACC)',
    institution: 'Los Angeles City College',
    units: 4,
    grade: 'A',
    gradePoints: 4.0,
    status: 'completed',
    hasLab: true,
  },
  {
    category: 'physiology',
    course: 'PHYSIOL 001 — Intro to Human Physiology (LAHC)',
    institution: 'Los Angeles Harbor College',
    units: 4,
    grade: 'A',
    gradePoints: 4.0,
    status: 'completed',
    hasLab: true,
  },
  {
    category: 'nutrition',
    course: 'FAM & CS 021 — Nutrition (LACC)',
    institution: 'Los Angeles City College',
    units: 3,
    grade: 'A',
    gradePoints: 4.0,
    status: 'completed',
  },
  {
    category: 'public-speaking',
    course: 'COMM C1000 — Intro to Public Speaking (LAVC)',
    institution: 'Los Angeles Valley College',
    units: 3,
    grade: 'B',
    gradePoints: 3.0,
    status: 'completed',
  },
  {
    category: 'sociology',
    course: 'SOC 001 — Intro to Sociology (WLAC)',
    institution: 'West Los Angeles College',
    units: 3,
    grade: 'A',
    gradePoints: 4.0,
    status: 'completed',
  },
  {
    category: 'developmental-psychology',
    course: 'PSYCH 041 — Life-Span Psych (LACC)',
    institution: 'Los Angeles City College',
    units: 3,
    grade: 'A',
    gradePoints: 4.0,
    status: 'completed',
  },
  {
    category: 'developmental-psychology',
    course: 'CH DEV 001 — Child Growth & Development (LAMC)',
    institution: 'Los Angeles Mission College',
    units: 3,
    grade: 'A',
    gradePoints: 4.0,
    status: 'completed',
  },
  {
    category: 'developmental-psychology',
    course: 'HMD 111 — Intro to Human Development (Connecticut College)',
    institution: 'Connecticut College',
    units: 4,
    grade: 'B+',
    gradePoints: 3.3,
    status: 'completed',
  },
  {
    category: 'developmental-psychology',
    course: 'PSYC 350 — Developmental Psychology (UMass Amherst)',
    institution: 'UMass Amherst',
    units: 3,
    grade: 'A-',
    gradePoints: 3.7,
    status: 'completed',
  },
  {
    category: 'intro-psychology',
    course: 'PSY 100 — Introduction to Psychology (Connecticut College)',
    institution: 'Connecticut College',
    units: 4,
    grade: 'A-',
    gradePoints: 3.7,
    status: 'completed',
  },
  {
    category: 'statistics',
    course: 'PSY 201 — Psychological Statistics (Connecticut College)',
    institution: 'Connecticut College',
    units: 4,
    grade: 'C',
    gradePoints: 2.0,
    status: 'completed',
  },
  {
    category: 'research-methods',
    course: 'PSY 202 — Research Methods in Psychology (Connecticut College)',
    institution: 'Connecticut College',
    units: 4,
    grade: 'B-',
    gradePoints: 2.7,
    status: 'completed',
  },
  {
    category: 'written-communication',
    course: 'EAS 106 — CC: Superheroes & Underdogs (Connecticut College)',
    institution: 'Connecticut College',
    units: 4,
    grade: 'B+',
    gradePoints: 3.3,
    status: 'completed',
  },
  {
    category: 'general-chemistry',
    course: 'CHEM 051 — Fundamentals of Chemistry I (LAVC)',
    institution: 'Los Angeles Valley College',
    units: 5,
    status: 'in-progress',
    hasLab: true,
  },
];
