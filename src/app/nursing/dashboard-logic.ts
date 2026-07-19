import type { NursingProgram, RequirementCategory } from '@/data/nursingPrograms';
import type { TranscriptCourse } from '@/data/nursingTranscript';
import { type RequirementMatch, matchProgramRequirements } from './matching-logic';
import { type PrereqGpaResult, calculatePrereqGpa } from './gpa-logic';
import { type ActiveWindow, getActiveWindow } from './window-logic';
import { type ReadinessAssessment, assessReadiness } from './readiness-logic';

export interface ProgramView {
  program: NursingProgram;
  matches: RequirementMatch[];
  gpa: PrereqGpaResult;
  activeWindow: ActiveWindow | null;
  readiness: ReadinessAssessment;
}

/** Runs the full matching → GPA → window → readiness pipeline once per
 *  program. Callers memoize this (useMemo) so it isn't recomputed per render. */
export function buildProgramView(
  program: NursingProgram,
  transcriptIndex: Map<RequirementCategory, TranscriptCourse[]>,
  now: Date
): ProgramView {
  const matches = matchProgramRequirements(program, transcriptIndex);
  const gpa = calculatePrereqGpa(matches);
  return {
    program,
    matches,
    gpa,
    activeWindow: getActiveWindow(program, now),
    readiness: assessReadiness(matches, gpa),
  };
}

export interface CityGroup {
  city: string;
  views: ProgramView[];
}

/** Buckets by city in a single pass, then sorts city names and each city's
 *  programs alphabetically by institution — cities aren't a fixed enum like
 *  InternetFeature categories, so the order is derived from the data. */
export function groupProgramsByCity(views: ProgramView[]): CityGroup[] {
  const byCity = new Map<string, ProgramView[]>();
  for (const view of views) {
    const bucket = byCity.get(view.program.city);
    if (bucket) {
      bucket.push(view);
    } else {
      byCity.set(view.program.city, [view]);
    }
  }

  const groups: CityGroup[] = [];
  for (const city of Array.from(byCity.keys()).sort((a, b) => a.localeCompare(b))) {
    const cityViews = byCity.get(city)!;
    cityViews.sort((a, b) => a.program.institution.localeCompare(b.program.institution));
    groups.push({ city, views: cityViews });
  }
  return groups;
}

export const ALL_CITIES = 'all';

export function filterViewsByCity(views: ProgramView[], selectedCity: string): ProgramView[] {
  if (selectedCity === ALL_CITIES) return views;
  return views.filter((view) => view.program.city === selectedCity);
}

/** Unique city names present in the data, alphabetically — feeds the filter bar. */
export function listCities(programs: NursingProgram[]): string[] {
  const cities = new Set<string>();
  for (const program of programs) {
    cities.add(program.city);
  }
  return Array.from(cities).sort((a, b) => a.localeCompare(b));
}

export type StarredMap = Record<string, boolean>;
export type TaskCompletionMap = Record<string, Record<string, boolean>>;

/** Shared empty-map sentinels, so components never allocate a fresh {} per
 *  render just to satisfy a "no undefined" default. */
export const EMPTY_STARRED: StarredMap = {};
export const EMPTY_TASKS: TaskCompletionMap = {};
export const EMPTY_PROGRAM_TASKS: Record<string, boolean> = {};

export interface ApplicationTask {
  id: string;
  label: string;
}

/** Fixed catalog of manual application-task checkboxes, shown per program.
 *  Not derived from data — every program shares the same generic checklist. */
export const APPLICATION_TASKS: ApplicationTask[] = [
  { id: 'request-transcripts', label: 'Request official transcripts from every institution' },
  { id: 'personal-statement', label: 'Draft personal statement / statement of intent' },
  { id: 'recommendations', label: 'Request letters of recommendation' },
  { id: 'submit-application', label: 'Submit the application' },
  { id: 'pay-fee', label: 'Pay the application fee' },
  { id: 'confirm-prereqs', label: 'Confirm prerequisite deadlines directly with the program' },
];
