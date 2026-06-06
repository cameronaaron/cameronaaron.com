import { describe, expect, it } from 'vitest';

import {
  CURSOR_INTERACTIVE_SELECTOR,
  appendTrailPoint,
  createRipple,
  decayTrailPoints,
  getTrailVisualState,
  isInteractiveTarget,
  shouldSampleTrail,
} from './logic';

describe('cursor trail logic', () => {
  it('samples trail only when enough time elapsed', () => {
    expect(shouldSampleTrail(10, 20)).toBe(false);
    expect(shouldSampleTrail(10, 26)).toBe(true);
  });

  it('appends and trims trail points to configured max', () => {
    const initial = Array.from({ length: 20 }, (_, i) => ({ id: i, x: i, y: i, life: 1 }));
    const next = appendTrailPoint(initial, 20, 99, 88);

    expect(next).toHaveLength(20);
    expect(next[0].id).toBe(1);
    expect(next[next.length - 1]).toEqual({ id: 20, x: 99, y: 88, life: 1 });
  });

  it('decays life and removes expired points', () => {
    const next = decayTrailPoints([
      { id: 1, x: 0, y: 0, life: 1 },
      { id: 2, x: 0, y: 0, life: 0.01 },
    ]);

    expect(next.length).toBe(1);
    expect(next[0].life).toBeLessThan(1);
  });

  it('detects interactive hover targets through closest lookup', () => {
    const button = document.createElement('button');
    const child = document.createElement('span');
    button.appendChild(child);

    expect(CURSOR_INTERACTIVE_SELECTOR.includes('button')).toBe(true);
    expect(isInteractiveTarget(child)).toBe(true);
    expect(isInteractiveTarget(document.createElement('div'))).toBe(false);
  });

  it('creates ripples with stable shape', () => {
    expect(createRipple(7, 123, 456)).toEqual({ id: 7, x: 123, y: 456 });
  });

  it('computes stable visual state for trail points', () => {
    const first = getTrailVisualState(0, 10, 1);
    const latest = getTrailVisualState(9, 10, 1);

    expect(first.opacity).toBeLessThan(latest.opacity);
    expect(first.scale).toBeLessThan(latest.scale);
    expect(first.opacity).toBeGreaterThanOrEqual(0.1);
  });
});
