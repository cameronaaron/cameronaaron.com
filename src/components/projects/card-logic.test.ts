import { describe, expect, it } from 'vitest';
import {
  calculateCardTiltTargets,
  getProjectCardCta,
  getProjectReadingMinutes,
} from '@/components/projects/card-logic';

describe('project card logic', () => {
  it('calculates normalized card tilt targets from pointer position', () => {
    expect(calculateCardTiltTargets({ left: 10, top: 10, width: 100, height: 100 }, 10, 10)).toEqual({ x: 0, y: 0 });
    expect(calculateCardTiltTargets({ left: 10, top: 10, width: 100, height: 100 }, 60, 60)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('derives reading time with a minimum floor', () => {
    expect(getProjectReadingMinutes('short text')).toBe(2);
    expect(getProjectReadingMinutes('a'.repeat(390))).toBe(3);
  });

  it('returns explicit CTA text with fallback', () => {
    expect(getProjectCardCta('View Abstract')).toBe('View Abstract');
    expect(getProjectCardCta()).toBe('Read More');
  });
});
