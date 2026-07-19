import { describe, expect, it } from 'vitest';

import type { NursingProgram } from '@/data/nursingPrograms';
import { buildTranscriptIndex } from './matching-logic';
import {
  ALL_CITIES,
  APPLICATION_TASKS,
  EMPTY_PROGRAM_TASKS,
  EMPTY_STARRED,
  EMPTY_TASKS,
  buildProgramView,
  filterViewsByCity,
  groupProgramsByCity,
  listCities,
} from './dashboard-logic';

function program(overrides: Partial<NursingProgram> = {}): NursingProgram {
  return {
    id: overrides.id ?? 'test',
    institution: 'Zebra University',
    programName: 'Test Program',
    city: 'Los Angeles',
    degreeType: 'accelerated-bsn',
    requiresChemistry: false,
    prerequisites: [{ category: 'anatomy', label: 'Anatomy' }],
    applicationWindows: [],
    sourceUrls: ['https://example.edu/'],
    ...overrides,
  };
}

describe('buildProgramView', () => {
  it('composes matching, gpa, window, and readiness for a program', () => {
    const view = buildProgramView(program(), buildTranscriptIndex([]), new Date('2027-01-01'));
    expect(view.matches).toHaveLength(1);
    expect(view.gpa.gpa).toBeNull();
    expect(view.activeWindow).toBeNull();
    expect(view.readiness.band).toBe('early');
  });
});

describe('groupProgramsByCity', () => {
  it('groups by city and sorts cities and institutions alphabetically', () => {
    const now = new Date('2027-01-01');
    const index = buildTranscriptIndex([]);
    const views = [
      buildProgramView(program({ id: 'a', city: 'San Diego', institution: 'Beta College' }), index, now),
      buildProgramView(program({ id: 'b', city: 'Azusa', institution: 'Zebra University' }), index, now),
      buildProgramView(program({ id: 'c', city: 'Azusa', institution: 'Alpha College' }), index, now),
    ];

    const groups = groupProgramsByCity(views);
    expect(groups.map((g) => g.city)).toEqual(['Azusa', 'San Diego']);
    expect(groups[0].views.map((v) => v.program.institution)).toEqual(['Alpha College', 'Zebra University']);
  });
});

describe('listCities', () => {
  it('returns unique, alphabetically-sorted cities', () => {
    const cities = listCities([
      program({ id: 'a', city: 'San Diego' }),
      program({ id: 'b', city: 'Azusa' }),
      program({ id: 'c', city: 'Azusa' }),
    ]);
    expect(cities).toEqual(['Azusa', 'San Diego']);
  });
});

describe('filterViewsByCity', () => {
  const now = new Date('2027-01-01');
  const index = buildTranscriptIndex([]);
  const views = [
    buildProgramView(program({ id: 'a', city: 'San Diego' }), index, now),
    buildProgramView(program({ id: 'b', city: 'Azusa' }), index, now),
  ];

  it('returns everything when the filter is ALL_CITIES', () => {
    expect(filterViewsByCity(views, ALL_CITIES)).toHaveLength(2);
  });

  it('filters to a single city', () => {
    const filtered = filterViewsByCity(views, 'Azusa');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].program.city).toBe('Azusa');
  });
});

describe('ALL_CITIES', () => {
  it('is the exact sentinel value the filter bar and dashboard compare against', () => {
    expect(ALL_CITIES).toBe('all');
  });
});

describe('APPLICATION_TASKS', () => {
  it('is a non-empty fixed catalog with unique ids', () => {
    expect(APPLICATION_TASKS.length).toBeGreaterThan(0);
    const ids = new Set(APPLICATION_TASKS.map((t) => t.id));
    expect(ids.size).toBe(APPLICATION_TASKS.length);
  });

  it('pins the exact id and label of every task, in order', () => {
    expect(APPLICATION_TASKS).toEqual([
      { id: 'request-transcripts', label: 'Request official transcripts from every institution' },
      { id: 'personal-statement', label: 'Draft personal statement / statement of intent' },
      { id: 'recommendations', label: 'Request letters of recommendation' },
      { id: 'submit-application', label: 'Submit the application' },
      { id: 'pay-fee', label: 'Pay the application fee' },
      { id: 'confirm-prereqs', label: 'Confirm prerequisite deadlines directly with the program' },
    ]);
  });
});

describe('empty-map sentinels', () => {
  it('are genuinely empty', () => {
    expect(EMPTY_STARRED).toEqual({});
    expect(EMPTY_TASKS).toEqual({});
    expect(EMPTY_PROGRAM_TASKS).toEqual({});
  });
});
