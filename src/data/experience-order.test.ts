import { describe, expect, it } from 'vitest';

import { experiences } from './experience';

const monthIndex: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseYearMonth(value: string, usePeriodEnd: boolean): number {
  const trimmed = value.trim().toLowerCase();

  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    const month = usePeriodEnd ? 11 : 0;
    return year * 12 + month;
  }

  const monthYear = trimmed.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})$/);
  if (monthYear) {
    const month = monthIndex[monthYear[1]];
    const year = Number(monthYear[2]);
    return year * 12 + month;
  }

  throw new Error(`Unsupported period format: ${value}`);
}

function parsePeriodRange(period: string) {
  const [rawStart, rawEnd] = period.split('-').map((part) => part.trim());
  if (!rawStart || !rawEnd) {
    throw new Error(`Unsupported range format: ${period}`);
  }

  return {
    start: parseYearMonth(rawStart, false),
    end: parseYearMonth(rawEnd, true),
  };
}

function latestEndForCompany(companyIndex: number): number {
  const company = experiences[companyIndex];
  return Math.max(...company.positions.map((position) => parsePeriodRange(position.period).end));
}

describe('experience date ordering', () => {
  it('keeps companies ordered from most recent to oldest by end date', () => {
    for (let i = 1; i < experiences.length; i += 1) {
      expect(latestEndForCompany(i - 1)).toBeGreaterThanOrEqual(latestEndForCompany(i));
    }
  });

  it('keeps each company positions ordered from most recent to oldest', () => {
    experiences.forEach((company) => {
      for (let i = 1; i < company.positions.length; i += 1) {
        const previous = parsePeriodRange(company.positions[i - 1].period);
        const current = parsePeriodRange(company.positions[i].period);

        if (previous.end === current.end) {
          expect(previous.start).toBeGreaterThanOrEqual(current.start);
        } else {
          expect(previous.end).toBeGreaterThanOrEqual(current.end);
        }
      }
    });
  });
});
