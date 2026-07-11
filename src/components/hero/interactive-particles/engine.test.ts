import { describe, expect, it } from 'vitest';

import {
  ATTRACTION_STRENGTH_BALANCED,
  ATTRACTION_STRENGTH_FULL,
  CONNECTION_MAX_OPACITY,
  CONNECTION_OPACITY_TIERS,
  CONNECTION_TIER_STYLES,
  GLOW_CORE_STOP,
  GLOW_DIAMETER_MULTIPLIER,
  GLOW_SPRITE_SIZE,
  POINTER_ATTRACT_RADIUS,
  POINTER_ATTRACT_RADIUS_SQ,
  PULSE_BASE_DURATION_MS,
  PULSE_DURATION_STEP_MS,
  PULSE_DURATION_VARIANTS,
  PULSE_OPACITY_AMPLITUDE,
  PULSE_SCALE_AMPLITUDE,
  appendBursts,
  buildConnections,
  createBurstParticles,
  createInitialParticles,
  createSeededRandom,
  getConnectionOpacityTier,
  getGlowGradientStops,
  getParticlePulse,
  getQualityConfig,
  normalizePointerToPercent,
  percentToPx,
  stepBursts,
  stepParticles,
  type BurstParticle,
  type Connection,
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
    expect(getQualityConfig('reduced').count).toBe(0);
  });

  it('getQualityConfig is an O(1) table lookup returning stable references', () => {
    expect(getQualityConfig('full')).toBe(getQualityConfig('full'));
    expect(getQualityConfig('lite')).toBe(getQualityConfig('reduced'));
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

  it('buildConnections reuses a caller-provided pool with zero steady-state allocation', () => {
    const particles = Array.from({ length: 4 }, (_, i) => ({
      id: i, x: i * 2, y: 0, size: 1, color: '#000', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0,
    }));
    const pool: Connection[] = [];

    const first = buildConnections(particles, 10, 10, pool);
    expect(first).toBe(pool);
    const firstLength = first.length;
    expect(firstLength).toBeGreaterThan(1);
    const firstSlot = first[0];

    // Second frame with a tighter distance: same array, same object slots
    // rewritten in place, length shrunk to the new connection count.
    const second = buildConnections(particles, 3, 10, pool);
    expect(second).toBe(pool);
    expect(second[0]).toBe(firstSlot);
    expect(second.length).toBeLessThan(firstLength);
    expect(second.length).toBeGreaterThan(0);
    expect(second[0].id).toBe(1); // pair (0,1) → 0 * 1000 + 1
  });

  it('appendBursts appends within the cap without trimming', () => {
    const makeBurst = (id: number): BurstParticle => ({ id, x: 0, y: 0, vx: 0, vy: 0, life: 1, size: 1, color: 'x' });
    const bursts = [makeBurst(1), makeBurst(2)];

    const result = appendBursts(bursts, [makeBurst(3)], 5);
    expect(result).toBe(bursts);
    expect(bursts.map((b) => b.id)).toEqual([1, 2, 3]);
  });

  it('appendBursts trims the oldest bursts in place when the cap is exceeded', () => {
    const makeBurst = (id: number): BurstParticle => ({ id, x: 0, y: 0, vx: 0, vy: 0, life: 1, size: 1, color: 'x' });
    const bursts = [makeBurst(1), makeBurst(2), makeBurst(3)];

    appendBursts(bursts, [makeBurst(4), makeBurst(5)], 4);
    // Same semantics as the old concat(...).slice(-max): keep the newest 4.
    expect(bursts.map((b) => b.id)).toEqual([2, 3, 4, 5]);
  });

  it('appendBursts keeps only the newest maxBursts when incoming alone exceeds the cap', () => {
    const makeBurst = (id: number): BurstParticle => ({ id, x: 0, y: 0, vx: 0, vy: 0, life: 1, size: 1, color: 'x' });
    const bursts = [makeBurst(1)];

    appendBursts(bursts, [makeBurst(2), makeBurst(3), makeBurst(4)], 2);
    expect(bursts.map((b) => b.id)).toEqual([3, 4]);
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

  it('exports pulse constants matching the old Framer keyframe animation', () => {
    expect(PULSE_BASE_DURATION_MS).toBe(2600);
    expect(PULSE_DURATION_STEP_MS).toBe(300);
    expect(PULSE_DURATION_VARIANTS).toBe(5);
    expect(PULSE_SCALE_AMPLITUDE).toBe(0.35);
    expect(PULSE_OPACITY_AMPLITUDE).toBe(0.4);
  });

  it('getParticlePulse starts at rest and peaks mid-period', () => {
    const rest = getParticlePulse(0, 0);
    expect(rest.scale).toBeCloseTo(1);
    expect(rest.opacityMultiplier).toBeCloseTo(1);

    const peak = getParticlePulse(PULSE_BASE_DURATION_MS / 2, 0);
    expect(peak.scale).toBeCloseTo(1 + PULSE_SCALE_AMPLITUDE);
    expect(peak.opacityMultiplier).toBeCloseTo(1 + PULSE_OPACITY_AMPLITUDE);

    const fullCycle = getParticlePulse(PULSE_BASE_DURATION_MS, 0);
    expect(fullCycle.scale).toBeCloseTo(1);
  });

  it('getParticlePulse writes into a caller-provided scratch object without allocating', () => {
    const scratch = { scale: 0, opacityMultiplier: 0 };
    const result = getParticlePulse(PULSE_BASE_DURATION_MS / 2, 0, scratch);

    expect(result).toBe(scratch);
    const allocated = getParticlePulse(PULSE_BASE_DURATION_MS / 2, 0);
    expect(scratch.scale).toBeCloseTo(allocated.scale);
    expect(scratch.opacityMultiplier).toBeCloseTo(allocated.opacityMultiplier);
  });

  it('stepParticles and stepBursts mutate in place and return the same array reference', () => {
    const particles = [{
      id: 1, x: 50, y: 50, size: 2, color: 'x',
      velocity: { x: 0.1, y: 0.1 }, opacity: 1, phase: 0,
    }];
    expect(stepParticles(particles, 1, { x: 50, y: 50, active: false }, 'full')).toBe(particles);

    const bursts = [{ id: 1, x: 0, y: 0, vx: 1, vy: 1, life: 1, size: 2, color: 'x' }];
    expect(stepBursts(bursts, 1)).toBe(bursts);
  });

  it('CONNECTION_TIER_STYLES precomputes one strokeStyle per opacity tier', () => {
    expect(CONNECTION_TIER_STYLES).toHaveLength(CONNECTION_OPACITY_TIERS.length);
    CONNECTION_OPACITY_TIERS.forEach((opacity, index) => {
      expect(CONNECTION_TIER_STYLES[index]).toBe(`rgba(103, 232, 249, ${opacity})`);
    });
  });

  it('getParticlePulse staggers periods by particle id so neighbours stay out of phase', () => {
    const time = PULSE_BASE_DURATION_MS / 2;
    const idZero = getParticlePulse(time, 0);
    const idTwo = getParticlePulse(time, 2);
    expect(idZero.scale).not.toBeCloseTo(idTwo.scale);

    // Period variants wrap at PULSE_DURATION_VARIANTS
    const wrapped = getParticlePulse(time, PULSE_DURATION_VARIANTS);
    expect(wrapped.scale).toBeCloseTo(idZero.scale);
  });

  it('getConnectionOpacityTier maps the opacity range onto tier indices with clamping', () => {
    expect(getConnectionOpacityTier(0)).toBe(0);
    expect(getConnectionOpacityTier(CONNECTION_MAX_OPACITY / 2)).toBe(1);
    expect(getConnectionOpacityTier(CONNECTION_MAX_OPACITY)).toBe(CONNECTION_OPACITY_TIERS.length - 1);
    // Out-of-range inputs clamp instead of indexing past the tier table
    expect(getConnectionOpacityTier(-1)).toBe(0);
    expect(getConnectionOpacityTier(1)).toBe(CONNECTION_OPACITY_TIERS.length - 1);
  });

  it('exports glow sprite geometry as named constants', () => {
    expect(GLOW_SPRITE_SIZE).toBe(64);
    expect(GLOW_DIAMETER_MULTIPLIER).toBe(6);
    expect(GLOW_CORE_STOP).toBeGreaterThan(0);
    expect(GLOW_CORE_STOP).toBeLessThan(1);
  });

  it('getGlowGradientStops builds a solid-core, transparent-edge gradient', () => {
    const stops = getGlowGradientStops('rgba(34, 211, 238, 0.65)');
    expect(stops).toEqual([
      { offset: 0, color: 'rgba(34, 211, 238, 0.65)' },
      { offset: GLOW_CORE_STOP, color: 'rgba(34, 211, 238, 0.65)' },
      { offset: 1, color: 'rgba(0, 0, 0, 0)' },
    ]);
    // Offsets must be ascending — CanvasGradient.addColorStop requires it
    for (let i = 1; i < stops.length; i += 1) {
      expect(stops[i].offset).toBeGreaterThan(stops[i - 1].offset);
    }
  });

  it('percentToPx maps the 0–100 simulation space onto canvas pixels', () => {
    expect(percentToPx(0, 800)).toBe(0);
    expect(percentToPx(50, 800)).toBe(400);
    expect(percentToPx(100, 800)).toBe(800);
    expect(percentToPx(25, 0)).toBe(0);
  });

  it('CONNECTION_OPACITY_TIERS is ascending and within the connection opacity range', () => {
    for (let i = 0; i < CONNECTION_OPACITY_TIERS.length; i += 1) {
      expect(CONNECTION_OPACITY_TIERS[i]).toBeGreaterThan(0);
      expect(CONNECTION_OPACITY_TIERS[i]).toBeLessThanOrEqual(CONNECTION_MAX_OPACITY);
      if (i > 0) expect(CONNECTION_OPACITY_TIERS[i]).toBeGreaterThan(CONNECTION_OPACITY_TIERS[i - 1]);
    }
  });
});
