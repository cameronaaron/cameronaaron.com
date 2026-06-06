import { describe, expect, it } from 'vitest';
import {
  advanceBackgroundParticle,
  createBackgroundParticle,
  createBackgroundParticles,
  getBackgroundParticleConfig,
  getBackgroundParticleCount,
  getDistance,
  shouldRenderBackgroundParticles,
} from '@/components/hero/background-particles/engine';

describe('background particles engine', () => {
  it('selects render behavior by quality tier', () => {
    expect(shouldRenderBackgroundParticles('full')).toBe(true);
    expect(shouldRenderBackgroundParticles('balanced')).toBe(true);
    expect(shouldRenderBackgroundParticles('lite')).toBe(false);
    expect(shouldRenderBackgroundParticles('reduced')).toBe(false);
  });

  it('provides deterministic quality config values', () => {
    const config = getBackgroundParticleConfig('balanced');
    expect(config.maxParticles).toBe(95);
    expect(config.connectDistance).toBe(85);
    expect(config.useMousePull).toBe(true);
  });

  it('derives capped particle counts from viewport size', () => {
    const config = getBackgroundParticleConfig('full');
    expect(getBackgroundParticleCount(100, 100, config)).toBe(1);
    expect(getBackgroundParticleCount(4000, 4000, config)).toBe(config.maxParticles);
  });

  it('creates particles with deterministic random input', () => {
    const particle = createBackgroundParticle(200, 100, () => 0.5);
    expect(particle.x).toBe(100);
    expect(particle.y).toBe(50);
    expect(particle.size).toBe(2);
  });

  it('builds a particle collection for the active config', () => {
    const config = getBackgroundParticleConfig('balanced');
    const particles = createBackgroundParticles(340, 170, config, () => 0.5);
    expect(particles.length).toBe(getBackgroundParticleCount(340, 170, config));
  });

  it('advances, fades, and wraps particles', () => {
    const particle = {
      x: -1,
      y: 101,
      size: 1,
      speedX: 0.2,
      speedY: 0.2,
      opacity: 0.61,
      fadeSpeed: 0.01,
      originalX: 0,
      originalY: 0,
    };

    advanceBackgroundParticle(particle, 100, 100);

    expect(particle.x).toBe(100);
    expect(particle.y).toBe(0);
    expect(particle.fadeSpeed).toBeLessThan(0);
  });

  it('computes euclidean distances', () => {
    expect(getDistance(3, 4)).toBe(5);
  });
});
