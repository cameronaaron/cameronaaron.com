import { describe, expect, it } from 'vitest';

import { getHeroMotionConfig } from '@/components/hero/logic';

describe('getHeroMotionConfig — balanced tier (lines 30-31 branch coverage)', () => {
  it('returns balanced-tier parallaxDepth of 100', () => {
    const config = getHeroMotionConfig('balanced');
    expect(config.parallaxDepth).toBe(100);
  });

  it('returns balanced-tier scaleFloor of 0.88', () => {
    const config = getHeroMotionConfig('balanced');
    expect(config.scaleFloor).toBe(0.88);
  });

  it('returns shouldUseParallax false and showFloatingBadges false for balanced tier', () => {
    const config = getHeroMotionConfig('balanced');
    expect(config.shouldUseParallax).toBe(false);
    expect(config.showFloatingBadges).toBe(false);
  });

  it('returns fallback parallaxDepth of 45 for lite tier', () => {
    const config = getHeroMotionConfig('lite');
    expect(config.parallaxDepth).toBe(45);
  });

  it('returns fallback scaleFloor of 0.94 for lite tier', () => {
    const config = getHeroMotionConfig('lite');
    expect(config.scaleFloor).toBe(0.94);
  });

  it('returns fallback parallaxDepth of 45 for reduced tier', () => {
    const config = getHeroMotionConfig('reduced');
    expect(config.parallaxDepth).toBe(45);
  });

  it('returns fallback scaleFloor of 0.94 for reduced tier', () => {
    const config = getHeroMotionConfig('reduced');
    expect(config.scaleFloor).toBe(0.94);
  });
});
