import { describe, expect, it } from 'vitest';

import {
  LOCAL_TIME_REFRESH_MS,
  LOCAL_TIME_ZONE,
  formatLocalTime,
  getDaypartLabel,
  getLocalHour,
} from './local-time-logic';

// Fixed UTC instants → deterministic LA wall-clock (PST, UTC-8, no DST in Jan).
const JAN_MORNING_UTC = new Date('2026-01-15T18:30:00Z'); // 10:30 AM PST
const JAN_EVENING_UTC = new Date('2026-01-16T03:05:00Z'); // 7:05 PM PST (prev day)
const JAN_LATE_UTC = new Date('2026-01-15T10:00:00Z'); // 2:00 AM PST

describe('formatLocalTime', () => {
  it('formats an instant as LA wall-clock 12-hour time', () => {
    expect(formatLocalTime(JAN_MORNING_UTC)).toBe('10:30 AM');
    expect(formatLocalTime(JAN_EVENING_UTC)).toBe('7:05 PM');
  });
});

describe('getLocalHour', () => {
  it('returns the LA hour in 24h form', () => {
    expect(getLocalHour(JAN_MORNING_UTC)).toBe(10);
    expect(getLocalHour(JAN_EVENING_UTC)).toBe(19);
    expect(getLocalHour(JAN_LATE_UTC)).toBe(2);
  });
});

describe('getDaypartLabel', () => {
  it('picks a friendly day-part by LA hour', () => {
    expect(getDaypartLabel(JAN_LATE_UTC)).toBe('up late'); // 2 AM
    expect(getDaypartLabel(JAN_MORNING_UTC)).toBe('this morning'); // 10 AM
    expect(getDaypartLabel(JAN_EVENING_UTC)).toBe('this evening'); // 7 PM
  });

  it('falls through to tonight for the late band', () => {
    // 10 PM PST → after the last band (untilHour 21).
    expect(getDaypartLabel(new Date('2026-01-16T06:00:00Z'))).toBe('tonight');
  });
});

describe('constants', () => {
  it('targets Los Angeles on a sane refresh cadence', () => {
    expect(LOCAL_TIME_ZONE).toBe('America/Los_Angeles');
    expect(LOCAL_TIME_REFRESH_MS).toBeGreaterThan(0);
    expect(LOCAL_TIME_REFRESH_MS).toBeLessThanOrEqual(60_000);
  });
});
