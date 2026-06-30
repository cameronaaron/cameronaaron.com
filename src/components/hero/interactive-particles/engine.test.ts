import { describe, expect, it } from 'vitest';

import {
  ATTRACTION_STRENGTH_BALANCED,
  ATTRACTION_STRENGTH_FULL,
  POINTER_ATTRACT_RADIUS,
  POINTER_ATTRACT_RADIUS_SQ,
  buildConnections,
  createBurstParticles,
  createInitialParticles,
  createSeededRandom,
  getQualityConfig,
  normalizePointerToPercent,
  stepBursts,
  stepParticles,
} from './engine';

describe('interactive particle engine', () => {
  it('exports named constants with correct physics values', () => {
    expect(POINTER_ATTRACT_RADIUS).toBe(22);
    expect(POINTER_ATTRACT_RADIUS_SQ).toBe(22 * 22);
    expect(ATTRACTION_STRENGTH_FULL).toBeGreaterThan(ATTRACTION_STRENGTH_BALANCED);
    expect(ATTRACTION_STRENGTH_FULL).toBeCloseTo(0.012);
    expect(ATTRACTION_STRENGTH_BALANCED).toBeCloseTo(0.008);
  });

  it('creates deterministic seeded random streams', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);

    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('creates deterministic initial particles for a seed', () => {
    const first = createInitialParticles(3, 2024);
    const second = createInitialParticles(3, 2024);

    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
  });

  it('returns expected quality config for full and balanced', () => {
    expect(getQualityConfig('full').count).toBeGreaterThan(getQualityConfig('balanced').count);
    expect(getQualityConfig('lite').count).toBe(0);
  });

  it('builds bounded connection list', () => {
    const particles = [
      { id: 1, x: 0, y: 0, size: 1, color: '#000', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
      { id: 2, x: 1, y: 1, size: 1, color: '#000', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
      { id: 3, x: 2, y: 2, size: 1, color: '#000', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
    ];

    const lines = buildConnections(particles, 10, 2);
    expect(lines.length).toBe(2);
  });

  it('normalizes pointer coordinates with safe division', () => {
    expect(normalizePointerToPercent(50, 25, 100, 50)).toEqual({ x: 50, y: 50 });
    expect(normalizePointerToPercent(50, 25, 0, 0)).toEqual({ x: 5000, y: 2500 });
  });

  it('creates burst particles with sequential ids', () => {
    const bursts = createBurstParticles({
      baseX: 30,
      baseY: 40,
      count: 4,
      startId: 10,
      random: () => 0,
    });

    expect(bursts).toHaveLength(4);
    expect(bursts[0].id).toBe(10);
    expect(bursts[3].id).toBe(13);
  });

  it('steps particles while keeping them in viewport bounds', () => {
    const next = stepParticles(
      [
        {
          id: 1,
          x: 150,
          y: -20,
          size: 2,
          color: 'x',
          velocity: { x: 1, y: -1 },
          opacity: 1,
          phase: 0,
        },
      ],
      1,
      { x: 50, y: 50, active: false },
      'balanced'
    );

    expect(next[0].x).toBeGreaterThanOrEqual(0);
    expect(next[0].x).toBeLessThanOrEqual(100);
    expect(next[0].y).toBeGreaterThanOrEqual(0);
    expect(next[0].y).toBeLessThanOrEqual(100);
  });

  it('steps bursts and removes expired particles', () => {
    const next = stepBursts(
      [
        { id: 1, x: 0, y: 0, vx: 1, vy: 1, life: 0.01, size: 2, color: 'x' },
        { id: 2, x: 0, y: 0, vx: 1, vy: 1, life: 1, size: 2, color: 'x' },
      ],
      1
    );

    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(2);
    expect(next[0].life).toBeLessThan(1);
  });
});
