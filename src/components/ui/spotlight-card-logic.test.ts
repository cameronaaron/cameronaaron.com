import { describe, expect, it } from 'vitest';

import { calculateSpotlightPosition } from './spotlight-card-logic';

function makeRect(left: number, top: number, width = 200, height = 100): DOMRect {
  return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

describe('calculateSpotlightPosition', () => {
  it('returns 0,0 when pointer is exactly at the element origin', () => {
    const rect = makeRect(50, 80);
    expect(calculateSpotlightPosition(rect, 50, 80)).toEqual({ x: 0, y: 0 });
  });

  it('returns absolute pixel offset from the element top-left corner', () => {
    const rect = makeRect(100, 200);
    expect(calculateSpotlightPosition(rect, 160, 250)).toEqual({ x: 60, y: 50 });
  });

  it('handles a rect at the viewport origin', () => {
    const rect = makeRect(0, 0);
    expect(calculateSpotlightPosition(rect, 75, 40)).toEqual({ x: 75, y: 40 });
  });

  it('handles pointer at the far corner of the element', () => {
    const rect = makeRect(10, 20, 300, 150);
    expect(calculateSpotlightPosition(rect, 310, 170)).toEqual({ x: 300, y: 150 });
  });
});
