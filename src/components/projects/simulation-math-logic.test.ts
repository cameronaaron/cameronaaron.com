import { describe, expect, it } from 'vitest';
import { createSeededRandom, normalizePointerToPercent } from './simulation-math-logic';

describe('createSeededRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('diverges for different seeds', () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });

  it('matches the LCG recurrence exactly and stays in [0, 1)', () => {
    const random = createSeededRandom(7);
    const first = (7 * 1664525 + 1013904223) % 4294967296;
    const second = (first * 1664525 + 1013904223) % 4294967296;
    expect(random()).toBe(first / 4294967296);
    expect(random()).toBe(second / 4294967296);
    for (let i = 0; i < 200; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('normalizePointerToPercent', () => {
  it('expresses the pointer as a percentage of the box', () => {
    expect(normalizePointerToPercent(50, 25, 100, 50)).toEqual({ x: 50, y: 50 });
    expect(normalizePointerToPercent(0, 0, 100, 50)).toEqual({ x: 0, y: 0 });
  });

  it('treats a zero-sized box as one pixel rather than dividing by zero', () => {
    expect(normalizePointerToPercent(50, 25, 0, 0)).toEqual({ x: 5000, y: 2500 });
  });
});
