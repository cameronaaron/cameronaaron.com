import { describe, expect, it } from 'vitest';

import {
  STAT_COUNT_UP_DURATION_S,
  formatStatValue,
  parseStatValue,
} from './stat-card-logic';

describe('parseStatValue', () => {
  it('splits a numeric value with a suffix', () => {
    expect(parseStatValue('50+')).toEqual({ target: 50, suffix: '+' });
    expect(parseStatValue('8+')).toEqual({ target: 8, suffix: '+' });
  });

  it('handles a bare number with no suffix', () => {
    expect(parseStatValue('42')).toEqual({ target: 42, suffix: '' });
  });

  it('preserves multi-character suffixes verbatim', () => {
    expect(parseStatValue('10K+')).toEqual({ target: 10, suffix: 'K+' });
    expect(parseStatValue('99%')).toEqual({ target: 99, suffix: '%' });
  });

  it('opts out of counting for non-numeric values', () => {
    expect(parseStatValue('N/A')).toEqual({ target: null, suffix: '' });
    expect(parseStatValue('')).toEqual({ target: null, suffix: '' });
  });
});

describe('formatStatValue', () => {
  it('rounds the in-flight value and appends the suffix', () => {
    expect(formatStatValue(36.7, '+')).toBe('37+');
    expect(formatStatValue(0, '+')).toBe('0+');
    expect(formatStatValue(50, '')).toBe('50');
  });
});

describe('STAT_COUNT_UP_DURATION_S', () => {
  it('is a short, finite one-shot duration', () => {
    expect(STAT_COUNT_UP_DURATION_S).toBeGreaterThan(0);
    expect(STAT_COUNT_UP_DURATION_S).toBeLessThanOrEqual(3);
  });
});
