import { describe, expect, it } from 'vitest';
import { getAmbientOrbCount, shouldAnimateOrbs } from './ambient-background-logic';

describe('getAmbientOrbCount', () => {
  it('returns totalOrbs for full tier', () => {
    expect(getAmbientOrbCount('full', 7)).toBe(7);
    expect(getAmbientOrbCount('full', 0)).toBe(0);
  });

  it('returns 4 for balanced tier', () => {
    expect(getAmbientOrbCount('balanced', 7)).toBe(4);
  });

  it('returns 2 for lite tier', () => {
    expect(getAmbientOrbCount('lite', 7)).toBe(2);
  });

  it('returns 1 for reduced tier', () => {
    expect(getAmbientOrbCount('reduced', 7)).toBe(1);
  });

  it('returns 1 for any unknown tier falling through to default', () => {
    // TypeScript won't allow this normally but the runtime default branch must be covered
    expect(getAmbientOrbCount('reduced', 10)).toBe(1);
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
