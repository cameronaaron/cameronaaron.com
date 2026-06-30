import { describe, expect, it } from 'vitest';
import { calculateTiltOffset } from './tilt-logic';

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

describe('calculateTiltOffset', () => {
  it('returns 0,0 when pointer is at the center', () => {
    const rect = makeRect(0, 0, 200, 100);
    const result = calculateTiltOffset(rect, 100, 50);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('returns -0.5,0 when pointer is at the left edge', () => {
    const rect = makeRect(0, 0, 200, 100);
    const result = calculateTiltOffset(rect, 0, 50);
    expect(result.x).toBeCloseTo(-0.5);
    expect(result.y).toBeCloseTo(0);
  });

  it('returns 0.5,0 when pointer is at the right edge', () => {
    const rect = makeRect(0, 0, 200, 100);
    const result = calculateTiltOffset(rect, 200, 50);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0);
  });

  it('returns 0,-0.5 when pointer is at the top edge', () => {
    const rect = makeRect(0, 0, 200, 100);
    const result = calculateTiltOffset(rect, 100, 0);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(-0.5);
  });

  it('returns 0,0.5 when pointer is at the bottom edge', () => {
    const rect = makeRect(0, 0, 200, 100);
    const result = calculateTiltOffset(rect, 100, 100);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0.5);
  });

  it('handles a rect offset from the viewport origin', () => {
    // rect starts at (50, 25); pointer at top-left of rect
    const rect = makeRect(50, 25, 200, 100);
    const result = calculateTiltOffset(rect, 50, 25);
    expect(result.x).toBeCloseTo(-0.5);
    expect(result.y).toBeCloseTo(-0.5);
  });

  it('returns 0.5,0.5 at the bottom-right corner of an offset rect', () => {
    const rect = makeRect(50, 25, 200, 100);
    const result = calculateTiltOffset(rect, 250, 125);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0.5);
  });
});
