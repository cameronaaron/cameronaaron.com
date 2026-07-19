import { describe, expect, it } from 'vitest';

import type { ApplicationWindow, NursingProgram } from '@/data/nursingPrograms';
import {
  CLOSING_SOON_DAYS,
  NOW_REFRESH_MS,
  WINDOW_STATUS_STYLES,
  getActiveWindow,
  getWindowStatus,
} from './window-logic';

function window(overrides: Partial<ApplicationWindow> = {}): ApplicationWindow {
  return { term: 'Fall 2027', opens: '2027-01-01', closes: '2027-03-01', ...overrides };
}

function program(windows: ApplicationWindow[]): NursingProgram {
  return {
    id: 'test',
    institution: 'Test U',
    programName: 'Test Program',
    city: 'Test City',
    degreeType: 'accelerated-bsn',
    requiresChemistry: false,
    prerequisites: [],
    applicationWindows: windows,
    sourceUrls: ['https://example.edu/'],
  };
}

describe('NOW_REFRESH_MS', () => {
  it('is exactly 5 minutes in milliseconds', () => {
    expect(NOW_REFRESH_MS).toBe(300_000);
  });
});

describe('getWindowStatus', () => {
  const w = window({ opens: '2027-01-01', closes: '2027-03-01' });

  it('is upcoming before the window opens', () => {
    expect(getWindowStatus(w, new Date('2026-12-31'))).toBe('upcoming');
  });

  it('is open (not upcoming) at the exact opens instant — the opens boundary is inclusive', () => {
    expect(getWindowStatus(w, new Date(w.opens))).toBe('open');
  });

  it('is open well before the closing-soon threshold', () => {
    expect(getWindowStatus(w, new Date('2027-01-15'))).toBe('open');
  });

  it('is closing-soon exactly at the CLOSING_SOON_DAYS boundary', () => {
    const boundary = new Date(new Date(w.closes).getTime() - CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000);
    expect(getWindowStatus(w, boundary)).toBe('closing-soon');
  });

  it('is open one millisecond before the closing-soon boundary', () => {
    const justBefore = new Date(
      new Date(w.closes).getTime() - CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000 - 1
    );
    expect(getWindowStatus(w, justBefore)).toBe('open');
  });

  it('is closing-soon (not closed) at the exact closes instant — the closes boundary is inclusive', () => {
    expect(getWindowStatus(w, new Date(w.closes))).toBe('closing-soon');
  });

  it('is closed after the window closes', () => {
    expect(getWindowStatus(w, new Date('2027-03-02'))).toBe('closed');
  });
});

describe('getActiveWindow', () => {
  it('returns null when there are no windows on file', () => {
    expect(getActiveWindow(program([]), new Date('2027-01-15'))).toBeNull();
  });

  it('returns an open window immediately, ahead of an upcoming one', () => {
    const p = program([
      window({ term: 'Spring 2028', opens: '2027-11-01', closes: '2028-01-01' }),
      window({ term: 'Fall 2027', opens: '2027-01-01', closes: '2027-03-01' }),
    ]);
    const result = getActiveWindow(p, new Date('2027-01-15'));
    expect(result).toEqual({ window: p.applicationWindows[1], status: 'open' });
  });

  it('returns a closing-soon window immediately, ahead of an upcoming one', () => {
    const p = program([
      window({ term: 'Spring 2028', opens: '2027-11-01', closes: '2028-01-01' }),
      window({ term: 'Fall 2027', opens: '2027-01-01', closes: '2027-03-01' }),
    ]);
    // 2027-02-20 is within CLOSING_SOON_DAYS (14) of the Fall 2027 close date.
    const result = getActiveWindow(p, new Date('2027-02-20'));
    expect(result).toEqual({ window: p.applicationWindows[1], status: 'closing-soon' });
  });

  it('picks the soonest upcoming window when the earlier one is listed first', () => {
    const p = program([
      window({ term: 'Sooner', opens: '2027-06-01', closes: '2027-08-01' }),
      window({ term: 'Later', opens: '2028-01-01', closes: '2028-03-01' }),
    ]);
    const result = getActiveWindow(p, new Date('2027-01-01'));
    expect(result?.window.term).toBe('Sooner');
    expect(result?.status).toBe('upcoming');
  });

  it('picks the soonest upcoming window when the earlier one is listed second', () => {
    const p = program([
      window({ term: 'Later', opens: '2028-01-01', closes: '2028-03-01' }),
      window({ term: 'Sooner', opens: '2027-06-01', closes: '2027-08-01' }),
    ]);
    const result = getActiveWindow(p, new Date('2027-01-01'));
    expect(result?.window.term).toBe('Sooner');
    expect(result?.status).toBe('upcoming');
  });

  it('ignores a closed window when an upcoming one is also on file', () => {
    const p = program([
      window({ term: 'Past', opens: '2026-01-01', closes: '2026-03-01' }),
      window({ term: 'Future', opens: '2028-01-01', closes: '2028-03-01' }),
    ]);
    const result = getActiveWindow(p, new Date('2027-01-01'));
    expect(result?.window.term).toBe('Future');
    expect(result?.status).toBe('upcoming');
  });

  it('keeps the earlier-listed upcoming window on an exact opens-date tie', () => {
    const p = program([
      window({ term: 'Listed first', opens: '2027-06-01', closes: '2027-08-01' }),
      window({ term: 'Listed second, same opens date', opens: '2027-06-01', closes: '2027-09-01' }),
    ]);
    const result = getActiveWindow(p, new Date('2027-01-01'));
    expect(result?.window.term).toBe('Listed first');
  });

  it('falls back to a closed window when nothing is open or upcoming', () => {
    const p = program([window({ term: 'Fall 2027', opens: '2027-01-01', closes: '2027-03-01' })]);
    const result = getActiveWindow(p, new Date('2027-06-01'));
    expect(result).toEqual({ window: p.applicationWindows[0], status: 'closed' });
  });

  it('returns the first closed window when multiple windows are all closed', () => {
    const p = program([
      window({ term: 'First closed', opens: '2026-01-01', closes: '2026-03-01' }),
      window({ term: 'Second closed', opens: '2026-06-01', closes: '2026-08-01' }),
    ]);
    const result = getActiveWindow(p, new Date('2027-01-01'));
    expect(result?.window.term).toBe('First closed');
    expect(result?.status).toBe('closed');
  });
});

describe('WINDOW_STATUS_STYLES', () => {
  it('pins the exact label and className for every status', () => {
    expect(WINDOW_STATUS_STYLES.open).toEqual({
      label: 'Open now',
      className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    });
    expect(WINDOW_STATUS_STYLES['closing-soon']).toEqual({
      label: 'Closing soon',
      className: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
    });
    expect(WINDOW_STATUS_STYLES.closed).toEqual({
      label: 'Closed',
      className: 'border-white/15 bg-white/5 text-muted-foreground',
    });
    expect(WINDOW_STATUS_STYLES.upcoming).toEqual({
      label: 'Upcoming',
      className: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
    });
  });
});
