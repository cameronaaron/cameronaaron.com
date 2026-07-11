import { describe, expect, it } from 'vitest';
import {
  AMBIENT_ORBS,
  ORB_COUNT_BY_TIER,
  getVisibleAmbientOrbs,
  shouldAnimateOrbs,
} from './ambient-background-logic';

describe('getVisibleAmbientOrbs', () => {
  it('returns every orb for the full tier', () => {
    expect(getVisibleAmbientOrbs('full')).toHaveLength(AMBIENT_ORBS.length);
  });

  it('returns 4 orbs for balanced, 2 for lite, 1 for reduced', () => {
    expect(getVisibleAmbientOrbs('balanced')).toHaveLength(4);
    expect(getVisibleAmbientOrbs('lite')).toHaveLength(2);
    expect(getVisibleAmbientOrbs('reduced')).toHaveLength(1);
  });

  it('returns stable precomputed references — no per-call allocation', () => {
    expect(getVisibleAmbientOrbs('full')).toBe(getVisibleAmbientOrbs('full'));
    expect(getVisibleAmbientOrbs('balanced')).toBe(getVisibleAmbientOrbs('balanced'));
    expect(getVisibleAmbientOrbs('full')).toBe(AMBIENT_ORBS);
  });

  it('slices from the front so lower tiers render a prefix of the full set', () => {
    expect(getVisibleAmbientOrbs('balanced')).toEqual(AMBIENT_ORBS.slice(0, 4));
    expect(getVisibleAmbientOrbs('reduced')[0]).toBe(AMBIENT_ORBS[0]);
  });

  it('ORB_COUNT_BY_TIER matches the visible slice lengths for every tier', () => {
    for (const tier of ['full', 'balanced', 'lite', 'reduced'] as const) {
      expect(getVisibleAmbientOrbs(tier)).toHaveLength(ORB_COUNT_BY_TIER[tier]);
    }
  });
});

describe('shouldAnimateOrbs', () => {
  it('returns true only for full tier', () => {
    expect(shouldAnimateOrbs('full')).toBe(true);
  });

  it('returns false for balanced tier', () => {
    expect(shouldAnimateOrbs('balanced')).toBe(false);
  });

  it('returns false for lite tier', () => {
    expect(shouldAnimateOrbs('lite')).toBe(false);
  });

  it('returns false for reduced tier', () => {
    expect(shouldAnimateOrbs('reduced')).toBe(false);
  });
});
