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
  KNN_LINK_COUNT,
  KNN_LINK_RADIUS,
  KNN_LINK_RADIUS_SQ,
  KNN_LINK_STYLE,
  POINTER_ATTRACT_RADIUS,
  POINTER_ATTRACT_RADIUS_SQ,
  PULSE_BASE_DURATION_MS,
  PULSE_DURATION_STEP_MS,
  PULSE_DURATION_VARIANTS,
  PULSE_OPACITY_AMPLITUDE,
  PULSE_SCALE_AMPLITUDE,
  appendBursts,
  buildConnections,
  collectNearestParticles,
  createBurstParticles,
  createInitialParticles,
  createKnnHeap,
  createSeededRandom,
  knnOffer,
  resetKnnHeap,
  getConnectionOpacityTier,
  getGlowGradientStops,
  getParticlePulse,
  getQualityConfig,
  normalizePointerToPercent,
  PARTICLE_COLORS,
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

  it('computes exact particle fields from the seeded random stream (guards each generation formula)', () => {
    // Independent oracle: the same seeded stream, consumed in the exact order
    // createInitialParticles consumes it, with the formula re-derived here
    // rather than copied — catches an operator swap (* vs /, + vs -) in any
    // of the eight per-particle fields, not just "it's still deterministic".
    const oracle = createSeededRandom(2024);
    const rx = oracle();
    const ry = oracle();
    const rsize = oracle();
    const rcolor = oracle();
    const rvx = oracle();
    const rvy = oracle();
    const ropacity = oracle();
    const rphase = oracle();

    const [p] = createInitialParticles(1, 2024);

    expect(p.x).toBe(rx * 100);
    expect(p.y).toBe(ry * 100);
    expect(p.size).toBe(rsize * 3.2 + 1.8);
    expect(p.color).toBe(PARTICLE_COLORS[Math.floor(rcolor * PARTICLE_COLORS.length)]);
    expect(p.velocity.x).toBe((rvx - 0.5) * 0.08);
    expect(p.velocity.y).toBe((rvy - 0.5) * 0.08);
    expect(p.opacity).toBe(ropacity * 0.45 + 0.25);
    expect(p.phase).toBe(rphase * Math.PI * 2);
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

  it('computes the exact connection opacity from the distance falloff, and the exact pair id', () => {
    const particles = [
      { id: 0, x: 0, y: 0, size: 1, color: 'x', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
      { id: 1, x: 3, y: 4, size: 1, color: 'x', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
    ];
    const [line] = buildConnections(particles, 10, 5);

    expect(line.id).toBe(0 * 1000 + 1);
    expect(line.opacity).toBeCloseTo(CONNECTION_MAX_OPACITY * (1 - 5 / 10), 10);
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

  it('computes exact burst angle/speed/size/color from the random stream, per particle index', () => {
    const sequence = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
    let call = 0;
    const random = () => sequence[call++];

    const bursts = createBurstParticles({ baseX: 5, baseY: 6, count: 2, startId: 0, random });

    const angle0 = (Math.PI * 2 * 0) / 2 + 0.1 * 0.45;
    const speed0 = 0.55 + 0.2 * 0.85;
    expect(bursts[0].vx).toBeCloseTo(Math.cos(angle0) * speed0);
    expect(bursts[0].vy).toBeCloseTo(Math.sin(angle0) * speed0);
    expect(bursts[0].size).toBeCloseTo(2.2 + 0.3 * 2.1);
    expect(bursts[0].color).toBe(PARTICLE_COLORS[Math.floor(0.4 * PARTICLE_COLORS.length)]);

    // Index 1 of 2 proves the angle formula actually uses `i` (a stale copy
    // of index 0's angle would be caught here, not just an operator swap).
    const angle1 = (Math.PI * 2 * 1) / 2 + 0.5 * 0.45;
    const speed1 = 0.55 + 0.6 * 0.85;
    expect(bursts[1].vx).toBeCloseTo(Math.cos(angle1) * speed1);
    expect(bursts[1].vy).toBeCloseTo(Math.sin(angle1) * speed1);
    expect(bursts[1].size).toBeCloseTo(2.2 + 0.7 * 2.1);
    expect(bursts[1].color).toBe(PARTICLE_COLORS[Math.floor(0.8 * PARTICLE_COLORS.length)]);
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

  it('computes the exact phase/velocity/position update with the pointer inactive', () => {
    const [p] = stepParticles(
      [{ id: 1, x: 50, y: 50, size: 1, color: 'x', velocity: { x: 0.01, y: -0.01 }, opacity: 1, phase: 0.5 }],
      2,
      { x: 0, y: 0, active: false },
      'balanced'
    );

    const expectedPhase = 0.5 + 0.025 * 2;
    const expectedVX = 0.01 + Math.sin(expectedPhase) * 0.0023;
    const expectedVY = -0.01 + Math.cos(expectedPhase * 0.86) * 0.002;
    const expectedX = 50 + expectedVX * 2;
    const expectedY = 50 + expectedVY * 2;

    expect(p.phase).toBeCloseTo(expectedPhase, 10);
    expect(p.x).toBeCloseTo(expectedX, 10);
    expect(p.y).toBeCloseTo(expectedY, 10);
    expect(p.velocity.x).toBeCloseTo(expectedVX * 0.998, 10);
    expect(p.velocity.y).toBeCloseTo(expectedVY * 0.998, 10);
  });

  it('computes the exact pointer-attraction pull when in range, scaled by the full-tier attraction strength', () => {
    const [p] = stepParticles(
      [{ id: 1, x: 50, y: 50, size: 1, color: 'x', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 }],
      1,
      { x: 55, y: 50, active: true },
      'full'
    );

    const phase = 0 + 0.025 * 1;
    const oscVX = 0 + Math.sin(phase) * 0.0023;
    const oscVY = 0 + Math.cos(phase * 0.86) * 0.002;
    const preNextX = 50 + oscVX * 1;
    const preNextY = 50 + oscVY * 1;
    const dx = 55 - preNextX;
    const dy = 50 - preNextY;
    const dist2 = dx * dx + dy * dy;
    const distance = Math.sqrt(dist2);
    const pull = (22 - distance) / 22; // POINTER_ATTRACT_RADIUS = 22
    const pulledVX = oscVX + (dx / distance) * pull * 0.012 * 1; // ATTRACTION_STRENGTH_FULL
    const pulledVY = oscVY + (dy / distance) * pull * 0.012 * 1;
    const expectedX = preNextX + pulledVX;
    const expectedY = preNextY + pulledVY;

    expect(p.x).toBeCloseTo(expectedX, 10);
    expect(p.y).toBeCloseTo(expectedY, 10);
    expect(p.velocity.x).toBeCloseTo(pulledVX * 0.998, 10);
    expect(p.velocity.y).toBeCloseTo(pulledVY * 0.998, 10);
  });

  it('bounces off the right/bottom viewport edge with the exact damping factor', () => {
    const [p] = stepParticles(
      [{ id: 1, x: 99.99, y: 50, size: 1, color: 'x', velocity: { x: 5, y: 0 }, opacity: 1, phase: 0 }],
      1,
      { x: 0, y: 0, active: false },
      'balanced'
    );

    // Velocity overshoots past x=100, triggering the bounce branch: clamp to
    // 100 and flip+damp velocity by exactly -0.98, then the steady 0.998 drag.
    const phase = 0 + 0.025 * 1;
    const oscVX = 5 + Math.sin(phase) * 0.0023;
    const bouncedVX = oscVX * -0.98;

    expect(p.x).toBe(100);
    expect(p.velocity.x).toBeCloseTo(bouncedVX * 0.998, 10);
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

  it('computes the exact position/velocity/life decay for a surviving burst', () => {
    const [b] = stepBursts([{ id: 1, x: 10, y: 20, vx: 2, vy: -1, life: 1, size: 2, color: 'x' }], 3);

    expect(b.life).toBeCloseTo(1 - 0.03 * 3, 10);
    expect(b.x).toBeCloseTo(10 + 2 * 3, 10);
    expect(b.y).toBeCloseTo(20 + -1 * 3, 10);
    expect(b.vx).toBeCloseTo(2 * 0.985, 10);
    expect(b.vy).toBeCloseTo(-1 * 0.985, 10);
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

  it('computes the exact pulse scale/opacity for a nonzero particle id (guards the per-id duration offset)', () => {
    // particleId=0 above can't distinguish + from - in the duration formula
    // (0 * step is 0 either way) — a nonzero id actually shifts the period.
    const particleId = 7;
    const timeMs = 500;
    const duration = PULSE_BASE_DURATION_MS + (particleId % PULSE_DURATION_VARIANTS) * PULSE_DURATION_STEP_MS;
    const wave = 0.5 - 0.5 * Math.cos((Math.PI * 2 * timeMs) / duration);

    const pulse = getParticlePulse(timeMs, particleId);

    expect(pulse.scale).toBeCloseTo(1 + PULSE_SCALE_AMPLITUDE * wave, 10);
    expect(pulse.opacityMultiplier).toBeCloseTo(1 + PULSE_OPACITY_AMPLITUDE * wave, 10);
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
      expect(CONNECTION_TIER_STYLES[index]).toBe(`rgba(126, 231, 255, ${opacity})`);
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
    const stops = getGlowGradientStops('rgba(56, 214, 255, 0.65)');
    expect(stops).toEqual([
      { offset: 0, color: 'rgba(56, 214, 255, 0.65)' },
      { offset: GLOW_CORE_STOP, color: 'rgba(56, 214, 255, 0.65)' },
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

describe('cursor constellation — bounded max-heap K-nearest', () => {
  it('exports link constants with a precomputed stroke and squared radius', () => {
    expect(KNN_LINK_COUNT).toBeGreaterThan(0);
    expect(KNN_LINK_RADIUS_SQ).toBe(KNN_LINK_RADIUS * KNN_LINK_RADIUS);
    expect(KNN_LINK_STYLE).toContain('rgba(');
  });

  it('createKnnHeap allocates typed-array backing sized to the capacity', () => {
    const heap = createKnnHeap(4);
    expect(heap.capacity).toBe(4);
    expect(heap.size).toBe(0);
    expect(heap.dist2).toBeInstanceOf(Float32Array);
    expect(heap.index).toBeInstanceOf(Int16Array);
    expect(heap.dist2).toHaveLength(4);
    expect(heap.index).toHaveLength(4);
  });

  it('keeps exactly the K smallest distances out of a larger stream', () => {
    const heap = createKnnHeap(3);
    // Offer distances 5,1,4,2,8,3 → the three smallest are 1,2,3.
    for (const [d, i] of [[5, 0], [1, 1], [4, 2], [2, 3], [8, 4], [3, 5]] as const) {
      knnOffer(heap, d, i);
    }
    expect(heap.size).toBe(3);
    const kept = Array.from(heap.dist2.slice(0, heap.size)).sort((a, b) => a - b);
    expect(kept).toEqual([1, 2, 3]);
    // The root is the max-heap's worst kept element (the largest of the K).
    expect(heap.dist2[0]).toBe(3);
  });

  it('rejects a candidate no better than the current worst in O(1)', () => {
    const heap = createKnnHeap(2);
    knnOffer(heap, 1, 0);
    knnOffer(heap, 2, 1);
    const rootBefore = heap.dist2[0];
    knnOffer(heap, 9, 2); // worse than the root → rejected
    expect(heap.size).toBe(2);
    expect(heap.dist2[0]).toBe(rootBefore);
    expect(Array.from(heap.index.slice(0, 2)).sort()).toEqual([0, 1]);
  });

  it('maintains the exact max-heap array layout through a known offer sequence (guards sift-up/down comparisons)', () => {
    // The final kept SET is insensitive to some comparison-operator mutants
    // as long as the overall result still happens to be correct — this pins
    // the exact array layout after each step, which only the real sift-up/
    // sift-down comparisons reproduce.
    const heap = createKnnHeap(3);
    knnOffer(heap, 5, 0);
    knnOffer(heap, 2, 1);
    knnOffer(heap, 8, 2);
    knnOffer(heap, 1, 3); // replaces the root (8) — 1 < 8
    knnOffer(heap, 9, 4); // rejected — 9 is not < the current root (5)

    expect(Array.from(heap.dist2)).toEqual([5, 2, 1]);
    expect(Array.from(heap.index)).toEqual([0, 1, 3]);
    expect(heap.size).toBe(3);
  });

  it('sift-down recurses correctly past the root into a non-root parent (guards the child-index arithmetic)', () => {
    // A capacity-3 heap only ever sifts down from index 0, where parent*2
    // and parent/2 are both 0 — indistinguishable. A deeper heap forces the
    // recursion into a parent > 0, where the two diverge.
    const heap = createKnnHeap(7);
    for (const [d, i] of [[10, 0], [9, 1], [8, 2], [7, 3], [6, 4], [5, 5], [4, 6]] as const) {
      knnOffer(heap, d, i);
    }
    knnOffer(heap, 1, 7); // replaces the root, must sift down past level 0

    expect(Array.from(heap.dist2)).toEqual([9, 7, 8, 1, 6, 5, 4]);
    expect(Array.from(heap.index)).toEqual([1, 3, 2, 7, 4, 5, 6]);
  });

  it('resetKnnHeap empties the heap for reuse without reallocating', () => {
    const heap = createKnnHeap(3);
    const backing = heap.dist2;
    knnOffer(heap, 1, 0);
    resetKnnHeap(heap);
    expect(heap.size).toBe(0);
    expect(heap.dist2).toBe(backing);
  });

  it('collectNearestParticles keeps only in-radius particles, nearest first-K', () => {
    const particles = [
      { id: 0, x: 50, y: 50, size: 1, color: '#fff', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
      { id: 1, x: 52, y: 50, size: 1, color: '#fff', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
      { id: 2, x: 90, y: 90, size: 1, color: '#fff', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
    ];
    const heap = createKnnHeap(4);
    collectNearestParticles(particles, 50, 50, KNN_LINK_RADIUS_SQ, heap);

    const kept = Array.from(heap.index.slice(0, heap.size)).sort();
    // Particle 2 is far outside the radius; 0 and 1 are inside.
    expect(kept).toEqual([0, 1]);
  });

  it('collectNearestParticles caps the kept set at the heap capacity', () => {
    const particles = Array.from({ length: 10 }, (_, i) => ({
      id: i, x: 50 + i * 0.5, y: 50, size: 1, color: '#fff',
      velocity: { x: 0, y: 0 }, opacity: 1, phase: 0,
    }));
    const heap = createKnnHeap(4);
    collectNearestParticles(particles, 50, 50, KNN_LINK_RADIUS_SQ, heap);
    expect(heap.size).toBe(4);
  });
});
