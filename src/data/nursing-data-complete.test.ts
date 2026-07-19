import { describe, expect, it } from 'vitest';

import { REQUIREMENT_CATEGORIES, nursingPrograms } from './nursingPrograms';
import { transcriptCourses } from './nursingTranscript';

describe('nursing data completeness', () => {
  it('has at least one program', () => {
    expect(nursingPrograms.length).toBeGreaterThan(0);
  });

  it('every program has a unique id', () => {
    const ids = nursingPrograms.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every program cites at least one source URL', () => {
    for (const program of nursingPrograms) {
      expect(program.sourceUrls.length, `${program.id} has no sourceUrls`).toBeGreaterThan(0);
      for (const url of program.sourceUrls) {
        expect(url.startsWith('https://'), `${program.id} has a non-https sourceUrl: ${url}`).toBe(true);
      }
    }
  });

  it('every program has at least one prerequisite', () => {
    for (const program of nursingPrograms) {
      expect(program.prerequisites.length, `${program.id} has no prerequisites`).toBeGreaterThan(0);
    }
  });

  it('every program prerequisite category is a known RequirementCategory', () => {
    for (const program of nursingPrograms) {
      for (const prereq of program.prerequisites) {
        expect(
          REQUIREMENT_CATEGORIES,
          `${program.id} prerequisite "${prereq.label}" has an unknown category "${prereq.category}"`
        ).toContain(prereq.category);
      }
    }
  });

  it('every application window opens on or before it closes, using valid ISO dates', () => {
    for (const program of nursingPrograms) {
      for (const window of program.applicationWindows) {
        const opens = new Date(window.opens);
        const closes = new Date(window.closes);
        expect(Number.isNaN(opens.getTime()), `${program.id} window "${window.term}" has an invalid opens date`).toBe(
          false
        );
        expect(
          Number.isNaN(closes.getTime()),
          `${program.id} window "${window.term}" has an invalid closes date`
        ).toBe(false);
        expect(
          opens.getTime() <= closes.getTime(),
          `${program.id} window "${window.term}" closes before it opens`
        ).toBe(true);
      }
    }
  });

  it('every transcript course category is a known RequirementCategory', () => {
    for (const course of transcriptCourses) {
      expect(
        REQUIREMENT_CATEGORIES,
        `Transcript course "${course.course}" has an unknown category "${course.category}"`
      ).toContain(course.category);
    }
  });

  it('completed transcript courses carry a numeric gradePoints value', () => {
    for (const course of transcriptCourses) {
      if (course.status === 'completed') {
        expect(course.gradePoints, `Completed course "${course.course}" is missing gradePoints`).toBeDefined();
      }
    }
  });

  it('the MSMU program (Cameron\'s CHEM 051-independent option) does not require chemistry', () => {
    const msmu = nursingPrograms.find((p) => p.id === 'msmu-absn');
    expect(msmu?.requiresChemistry).toBe(false);
  });
});
