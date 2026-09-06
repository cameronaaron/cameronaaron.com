import { describe, expect, it } from 'vitest';

import { PARTICLE_COLORS } from '@/components/hero/interactive-particles/interactive-particles-engine';

import {
  HERO_FLOATING_BADGES,
  HERO_SIGNAL_CHIPS,
  HERO_WORLD_CHANGE_EVENT,
  HERO_WORLDS,
  buildHeroWorldChangeEvent,
  collectHeroWorldParticleColors,
  getHeroMotionConfig,
  getHeroWorldAtmosphere,
  getNextHeroWorld,
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

describe('hero world atmospheres', () => {
  it('gives every world tone a complete, distinct palette', () => {
    const tones = HERO_WORLDS.map((world) => world.tone);
    const accents = new Set<string>();
    const rgbs = new Set<string>();
    for (const tone of tones) {
      const atmosphere = getHeroWorldAtmosphere(tone);
      expect(atmosphere.accent).toMatch(/^#/);
      expect(atmosphere.halo).toContain('rgb');
      expect(atmosphere.wash).toContain('radial-gradient');
      expect(atmosphere.bloom).toContain('rgba');
      expect(atmosphere.connectionRgb).toMatch(/^\d+, \d+, \d+$/);
      expect(atmosphere.particleColors.length).toBe(4);
      accents.add(atmosphere.accent);
      rgbs.add(atmosphere.connectionRgb);
    }
    expect(accents.size).toBe(tones.length);
    expect(rgbs.size).toBe(tones.length);
  });

  it('keeps the ice particle catalog identical to the engine default', () => {
    expect([...getHeroWorldAtmosphere('ice').particleColors]).toEqual([...PARTICLE_COLORS]);
  });

  it('builds a window event that carries the chosen world palette', () => {
    const event = buildHeroWorldChangeEvent('violet');
    expect(event.type).toBe(HERO_WORLD_CHANGE_EVENT);
    expect(event.detail.tone).toBe('violet');
    expect(event.detail.colors).toBe(getHeroWorldAtmosphere('violet').particleColors);
  });

  it('collects unique particle colours across every world', () => {
    const colors = collectHeroWorldParticleColors();
    expect(new Set(colors).size).toBe(colors.length);
    expect(colors.length).toBeGreaterThanOrEqual(4);
    for (const world of HERO_WORLDS) {
      for (const color of getHeroWorldAtmosphere(world.tone).particleColors) {
        expect(colors).toContain(color);
      }
    }
  });
});
