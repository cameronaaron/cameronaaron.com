import { describe, expect, it } from 'vitest';
import { buildCompanyMonogram, calculateTiltTargets } from './card-logic';

describe('experience card logic', () => {
  it('calculates normalized tilt targets from pointer position', () => {
    expect(calculateTiltTargets({ left: 10, top: 10, width: 100, height: 100 }, 60, 60)).toEqual({ x: 0.5, y: 0.5 });
    expect(calculateTiltTargets({ left: 10, top: 10, width: 100, height: 100 }, 10, 10)).toEqual({ x: 0, y: 0 });
  });

  it('builds a compact company monogram for logo fallback', () => {
    expect(buildCompanyMonogram('Connecticut College')).toBe('CC');
    expect(buildCompanyMonogram('Los Angeles County EMS Agency')).toBe('LAC');
  });
});
