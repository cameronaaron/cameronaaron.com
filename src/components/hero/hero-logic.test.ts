import { describe, expect, it } from 'vitest';

import {
  HERO_FLOATING_BADGES,
  HERO_SIGNAL_CHIPS,
  HERO_WORLDS,
  getNextHeroWorld,
  getHeroMotionConfig,
} from './hero-logic';

describe('hero logic', () => {
  it('returns full-motion config for full tier', () => {
    const config = getHeroMotionConfig('full');
    expect(config.shouldUseParallax).toBe(true);
    expect(config.showFloatingBadges).toBe(true);
    expect(config.parallaxDepth).toBe(150);
    expect(config.scaleFloor).toBe(0.8);
  });

  it('returns reduced-motion config for lite/reduced tiers', () => {
    expect(getHeroMotionConfig('lite').shouldUseParallax).toBe(false);
    expect(getHeroMotionConfig('reduced').showFloatingBadges).toBe(false);
  });

  it('keeps stable hero chip and badge catalogs', () => {
    expect(HERO_SIGNAL_CHIPS).toContain('NP Path');
    expect(HERO_FLOATING_BADGES.map((badge) => badge.label)).toEqual([
      'EMT',
      'Security',
      'Research',
      'Future NP',
    ]);
  });

  it('pins the exact badge positioning classes (not just labels)', () => {
    expect(HERO_FLOATING_BADGES).toEqual([
      { label: 'EMT', className: '-left-4 top-10' },
      { label: 'Security', className: 'right-1 top-3' },
      { label: 'Research', className: '-right-8 bottom-24' },
      { label: 'Future NP', className: 'left-2 -bottom-4' },
    ]);
  });
});

describe('hero world navigation', () => {
  it.each([
    [0, 'ArrowRight', 1], [3, 'ArrowRight', 0],
    [0, 'ArrowLeft', 3], [2, 'ArrowLeft', 1],
    [2, 'Home', 0], [0, 'End', 3], [2, 'Tab', 2],
  ])('moves from %i with %s to %i', (current, key, next) => {
    expect(getNextHeroWorld(current, key)).toBe(next);
  });

  it('gives every world an existing destination and a distinct atmosphere', () => {
    expect(HERO_WORLDS).toHaveLength(HERO_SIGNAL_CHIPS.length);
    expect(HERO_WORLDS.map((world) => world.href)).toEqual(['#experience', '#projects', '#certifications', '#education']);
    expect(new Set(HERO_WORLDS.map((world) => world.tone)).size).toBe(4);
  });
});
