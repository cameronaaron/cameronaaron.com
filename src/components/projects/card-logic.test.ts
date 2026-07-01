import { describe, expect, it } from 'vitest';
import {
  getProjectCardCta,
  getProjectReadingMinutes,
} from '@/components/projects/card-logic';

describe('project card logic', () => {
  it('derives reading time with a minimum floor', () => {
    expect(getProjectReadingMinutes('short text')).toBe(2);
    expect(getProjectReadingMinutes('a'.repeat(390))).toBe(3);
  });

  it('returns explicit CTA text with fallback', () => {
    expect(getProjectCardCta('View Abstract')).toBe('View Abstract');
    expect(getProjectCardCta()).toBe('Read More');
  });
});
