import { describe, expect, it } from 'vitest';

import { calculateMagneticOffset } from './magnetic-logic';

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

describe('calculateMagneticOffset', () => {
  it('returns 0,0 when pointer is exactly at the element center', () => {
    const rect = makeRect(0, 0, 100, 100);
    expect(calculateMagneticOffset(rect, 50, 50, 0.5)).toEqual({ x: 0, y: 0 });
  });

  it('scales distance from center by strength', () => {
    // rect center is (50, 50); pointer at (70, 30) → distance (20, -20)
    const rect = makeRect(0, 0, 100, 100);
    const result = calculateMagneticOffset(rect, 70, 30, 0.5);
    expect(result.x).toBeCloseTo(10);
    expect(result.y).toBeCloseTo(-10);
  });

  it('handles a rect offset from the viewport origin', () => {
    // rect from (200, 100) to (400, 300) → center (300, 200)
    const rect = makeRect(200, 100, 200, 200);
    const result = calculateMagneticOffset(rect, 350, 180, 1);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(-20);
  });

  it('with strength 0 always returns 0,0 regardless of pointer position', () => {
    const rect = makeRect(0, 0, 200, 100);
    expect(calculateMagneticOffset(rect, 999, 999, 0)).toEqual({ x: 0, y: 0 });
  });

  it('strength 1 passes the full distance from center', () => {
    const rect = makeRect(0, 0, 100, 100);
    // center is (50, 50); pointer at (80, 20) → distance (30, -30)
    const result = calculateMagneticOffset(rect, 80, 20, 1);
    expect(result.x).toBeCloseTo(30);
    expect(result.y).toBeCloseTo(-30);
  });
});
