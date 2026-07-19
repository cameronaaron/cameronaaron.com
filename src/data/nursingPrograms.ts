/** Cross-school requirement categories. A program's prerequisites and
 *  Cameron's own transcript (see nursingTranscript.ts) are both tagged from
 *  this single enum, so any program's prereq list can be matched against his
 *  coursework generically instead of one hardcoded mapping per school. */
export const REQUIREMENT_CATEGORIES = [
  'general-chemistry',
  'microbiology',
  'anatomy',
  'physiology',
  'nutrition',
  'statistics',
  'developmental-psychology',
  'intro-psychology',
  'public-speaking',
  'written-communication',
  'research-methods',
  'epidemiology',
  'sociology',
] as const;

export type RequirementCategory = (typeof REQUIREMENT_CATEGORIES)[number];

export const DEGREE_TYPES = ['accelerated-bsn', 'second-degree-bsn', 'elm-msn', 'mecn'] as const;

export type DegreeType = (typeof DEGREE_TYPES)[number];

export interface ProgramPrerequisite {
  category: RequirementCategory;
  /** Human-readable label as the school states it, e.g. "Human Anatomy with lab". */
  label: string;
  requiredUnits?: number;
  requiresLab?: boolean;
  notes?: string;
}

/** ISO (YYYY-MM-DD) `opens`/`closes` dates. A program may have zero windows
 *  on file when a source only states "admits twice yearly, see website" —
 *  that is a legitimate state (see window-logic.ts), not an error. */
export interface ApplicationWindow {
  term: string;
  opens: string;
  closes: string;
  notes?: string;
}

export interface NursingProgram {
  id: string;
  institution: string;
  programName: string;
  city: string;
  degreeType: DegreeType;
  /** Whether chemistry is a strict prerequisite. False when an alternative
   *  (e.g. Physics) satisfies the requirement instead. */
  requiresChemistry: boolean;
  prerequisites: ProgramPrerequisite[];
  applicationWindows: ApplicationWindow[];
  sourceUrls: string[];
  notes?: string;
}

/**
 * Seed data sourced directly from documents in College_data/ (not web
 * research — see the plan file for the multi-agent research pass that will
 * expand this list). Each entry cites the source document it came from.
 */
export const nursingPrograms: NursingProgram[] = [
  {
    id: 'msmu-absn',
    institution: "Mount Saint Mary's University",
    programName: 'Accelerated BSN (ABSN)',
    city: 'Los Angeles',
    degreeType: 'accelerated-bsn',
    requiresChemistry: false,
    prerequisites: [
      {
        category: 'general-chemistry',
        label: 'Chemistry or Physics (4 units)',
        requiredUnits: 4,
        notes: 'Physics satisfies this requirement in place of Chemistry. Must be completed within 5 years of admission.',
      },
      {
        category: 'anatomy',
        label: 'Human Anatomy with Lab (4 units)',
        requiredUnits: 4,
        requiresLab: true,
        notes: 'Must be completed within 5 years of admission.',
      },
      {
        category: 'physiology',
        label: 'Human Physiology with Lab (4 units)',
        requiredUnits: 4,
        requiresLab: true,
        notes: 'Must be completed within 5 years of admission.',
      },
      {
        category: 'microbiology',
        label: 'Microbiology with Lab (4 units)',
        requiredUnits: 4,
        requiresLab: true,
        notes: 'Must be completed within 5 years of admission.',
      },
      { category: 'nutrition', label: 'Human Nutrition (3 units)', requiredUnits: 3 },
      { category: 'intro-psychology', label: 'General Psychology (3 units)', requiredUnits: 3 },
      {
        category: 'developmental-psychology',
        label: 'Life-Span Developmental Psychology, Infant through Older Adult (3 units)',
        requiredUnits: 3,
      },
      {
        category: 'sociology',
        label: 'Introduction to Sociology or Cultural Anthropology (3 units)',
        requiredUnits: 3,
      },
      {
        category: 'written-communication',
        label: 'Written Communication (ENG 1A or ENG 1B, 3 units)',
        requiredUnits: 3,
      },
      { category: 'public-speaking', label: 'Oral Communication (2-3 units)', requiredUnits: 2 },
    ],
    applicationWindows: [],
    sourceUrls: ["https://www.msmu.edu/"],
    notes:
      'Admits twice a year; applicants need a completed bachelor\'s degree with a cumulative GPA of at least 3.0. Exact application deadlines are not published in the source document — verify current-cycle dates on msmu.edu before relying on this tracker. Required nursing coursework must all be completed at MSMU (58 nursing units + 3 upper-division Bioethics units over 3 semesters).',
  },
  {
    id: 'apu-elm',
    institution: 'Azusa Pacific University',
    programName: "Entry-Level Master's in Nursing (ELM)",
    city: 'Azusa',
    degreeType: 'elm-msn',
    requiresChemistry: true,
    prerequisites: [
      { category: 'written-communication', label: 'Writing or Composition' },
      { category: 'public-speaking', label: 'Public Speaking' },
      { category: 'intro-psychology', label: 'Intro to Psychology' },
      { category: 'developmental-psychology', label: 'Human Growth and Development' },
      { category: 'statistics', label: 'Statistics' },
      {
        category: 'research-methods',
        label: 'Research Methods',
        notes: 'Must be in a behavioral science field.',
      },
      { category: 'anatomy', label: 'Human Anatomy with Lab', requiresLab: true },
      { category: 'physiology', label: 'Human Physiology with Lab', requiresLab: true },
      { category: 'general-chemistry', label: 'Biochemistry' },
      { category: 'general-chemistry', label: 'Organic Chemistry with Lab', requiresLab: true },
      { category: 'microbiology', label: 'General Microbiology with Lab', requiresLab: true },
    ],
    applicationWindows: [],
    sourceUrls: ["https://www.apu.edu/"],
    notes:
      "Grades of C- and below are not accepted for any prerequisite course. Regional campuses in San Bernardino (Inland Empire) and San Diego (Mission Valley) also offer this program. Exact application windows are not published in the source transfer guide — verify current-cycle dates with APU Graduate and Professional Admissions before relying on this tracker.",
  },
];
