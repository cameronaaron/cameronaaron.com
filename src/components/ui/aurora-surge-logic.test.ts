import { describe, expect, it } from 'vitest';

import {
  AURORA_SURGE_EVENT,
  KONAMI_SEQUENCE,
  SURGE_DURATION_MS,
  advanceKonamiIndex,
  isKonamiComplete,
  normalizeKonamiKey,
} from './aurora-surge-logic';

describe('normalizeKonamiKey', () => {
  it('lowercases single letters and leaves named keys verbatim', () => {
    expect(normalizeKonamiKey('B')).toBe('b');
    expect(normalizeKonamiKey('a')).toBe('a');
    expect(normalizeKonamiKey('ArrowUp')).toBe('ArrowUp');
  });
});

describe('advanceKonamiIndex', () => {
  it('walks the full sequence to completion', () => {
    let index = 0;
    for (const key of KONAMI_SEQUENCE) {
      index = advanceKonamiIndex(index, key);
    }
    expect(index).toBe(KONAMI_SEQUENCE.length);
    expect(isKonamiComplete(index)).toBe(true);
  });

  it('accepts uppercase letters at the tail', () => {
    let index = 0;
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A']) {
      index = advanceKonamiIndex(index, key);
    }
    expect(isKonamiComplete(index)).toBe(true);
  });

  it('restarts at 1 when the mismatch could begin a new attempt', () => {
    // ↑ ↑ ↑ — the third up is not ↓, but it starts a fresh run.
    let index = 0;
    index = advanceKonamiIndex(index, 'ArrowUp');
    index = advanceKonamiIndex(index, 'ArrowUp');
    index = advanceKonamiIndex(index, 'ArrowUp');
    expect(index).toBe(1);
  });

  it('resets to 0 on an unrelated key', () => {
    let index = advanceKonamiIndex(0, 'ArrowUp');
    index = advanceKonamiIndex(index, 'x');
    expect(index).toBe(0);
    expect(isKonamiComplete(index)).toBe(false);
  });
});

describe('surge constants', () => {
  it('exposes a stable event name and a finite duration', () => {
    expect(AURORA_SURGE_EVENT).toBe('aurora-surge');
    expect(SURGE_DURATION_MS).toBeGreaterThan(0);
    expect(Number.isFinite(SURGE_DURATION_MS)).toBe(true);
  });
});
