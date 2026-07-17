import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_OPACITY_TIERS,
  MOUSE_ACTIVE_THRESHOLD,
  MOUSE_INACTIVE_POSITION,
  MOUSE_PULL_STRENGTH,
  advanceBackgroundParticle,
  applyMousePull,
  createBackgroundParticle,
  createBackgroundParticles,
  createSpatialGrid,
  forEachConnectedPair,
  getBackgroundParticleConfig,
  getBackgroundParticleCount,
  getDistance,
  getGridDimensions,
  rebuildSpatialGrid,
  shouldRenderBackgroundParticles,
  type Particle,
} from '@/components/hero/background-particles/engine';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeParticle(x: number, y: number): Particle {
  return { x, y, size: 1, speedX: 0, speedY: 0, opacity: 0.4, fadeSpeed: 0, originalX: x, originalY: y };
}

/** Brute-force O(n²) pair finder for correctness comparison. */
function bruteForce(particles: Particle[], connectDist2: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < particles.length - 1; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      if (dx * dx + dy * dy < connectDist2) pairs.push([i, j]);
    }
  }
  return pairs;
}

function gridPairs(
  particles: Particle[],
  connectDist: number,
  width = 400,
  height = 400,
): [number, number][] {
  const { cols, rows } = getGridDimensions(width, height, connectDist);
  const sg = createSpatialGrid(cols, rows);
  rebuildSpatialGrid(sg, particles, connectDist);
  const result: [number, number][] = [];
  forEachConnectedPair(sg, particles, connectDist, connectDist * connectDist, (i, j) => {
    result.push([i, j]);
  });
  return result;
}

// ── Existing engine tests ──────────────────────────────────────────────────

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

  it('computes every particle field exactly from a varying random stream (0.5 collapses +/- and */ differences)', () => {
    // A constant 0.5 input makes `random() - 0.5` equal 0 regardless of a +/-
    // swap, and many *0.5 / /0.5 pairs coincide at that value too — a varying
    // sequence is required to actually distinguish the operators.
    const sequence = [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 0.15];
    let call = 0;
    const random = () => sequence[call++];

    const p = createBackgroundParticle(200, 100, random);

    expect(p.x).toBeCloseTo(0.1 * 200, 10);
    expect(p.y).toBeCloseTo(0.2 * 100, 10);
    expect(p.originalX).toBeCloseTo(0.3 * 200, 10);
    expect(p.originalY).toBeCloseTo(0.4 * 100, 10);
    expect(p.size).toBeCloseTo(0.6 * 2 + 1, 10);
    expect(p.speedX).toBeCloseTo((0.7 - 0.5) * 0.5, 10);
    expect(p.speedY).toBeCloseTo((0.8 - 0.5) * 0.5, 10);
    expect(p.opacity).toBeCloseTo(0.9 * 0.5 + 0.2, 10);
    expect(p.fadeSpeed).toBeCloseTo((0.15 - 0.5) * 0.01, 10);
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

// ── Spatial grid ───────────────────────────────────────────────────────────

describe('getGridDimensions', () => {
  it('returns cols = ceil(width/cell)+1 and rows = ceil(height/cell)+1', () => {
    expect(getGridDimensions(1280, 800, 100)).toEqual({ cols: 14, rows: 9 });
  });

  it('handles exact division', () => {
    // 1000/100 = 10 → ceil=10 → +1 = 11
    expect(getGridDimensions(1000, 500, 100)).toEqual({ cols: 11, rows: 6 });
  });

  it('handles non-divisible dimensions', () => {
    // 950/100 = 9.5 → ceil=10 → +1 = 11; 750/100 = 7.5 → ceil=8 → +1 = 9
    expect(getGridDimensions(950, 750, 100)).toEqual({ cols: 11, rows: 9 });
  });

  it('scales with smaller cell size', () => {
    const a = getGridDimensions(400, 400, 100);
    const b = getGridDimensions(400, 400, 50);
    expect(b.cols).toBeGreaterThan(a.cols);
    expect(b.rows).toBeGreaterThan(a.rows);
  });
});

describe('createSpatialGrid', () => {
  it('allocates Int16Array data and Uint8Array count of correct size', () => {
    const sg = createSpatialGrid(4, 3, 8);
    expect(sg.data).toBeInstanceOf(Int16Array);
    expect(sg.count).toBeInstanceOf(Uint8Array);
    expect(sg.data.length).toBe(4 * 3 * 8);  // cols × rows × maxPerCell
    expect(sg.count.length).toBe(4 * 3);      // cols × rows
  });

  it('initialises all counts to zero', () => {
    const sg = createSpatialGrid(3, 3);
    expect(Array.from(sg.count).every(c => c === 0)).toBe(true);
  });

  it('uses maxPerCell=32 by default', () => {
    const sg = createSpatialGrid(2, 2);
    expect(sg.maxPerCell).toBe(32);
    expect(sg.data.length).toBe(2 * 2 * 32);
  });

  it('stores cols and rows', () => {
    const sg = createSpatialGrid(5, 7);
    expect(sg.cols).toBe(5);
    expect(sg.rows).toBe(7);
  });
});

describe('rebuildSpatialGrid', () => {
  it('places a particle in the correct cell', () => {
    const sg = createSpatialGrid(4, 4, 8);
    // x=150, y=150 with cellSize=100 → col=1, row=1 → cell index=1*4+1=5
    rebuildSpatialGrid(sg, [makeParticle(150, 150)], 100);
    expect(sg.count[5]).toBe(1);
    expect(sg.data[5 * 8]).toBe(0); // particle index 0
  });

  it('clears stale counts from the previous frame', () => {
    const sg = createSpatialGrid(3, 3, 8);
    rebuildSpatialGrid(sg, [makeParticle(50, 50)], 100);
    expect(sg.count[0]).toBe(1);
    // Rebuild with NO particles — all counts must be zero
    rebuildSpatialGrid(sg, [], 100);
    expect(Array.from(sg.count).every(c => c === 0)).toBe(true);
  });

  it('places multiple particles in different cells', () => {
    const sg = createSpatialGrid(3, 3, 8);
    // col=0/row=0=cell0, col=1/row=0=cell1, col=0/row=1=cell3
    rebuildSpatialGrid(sg, [makeParticle(10, 10), makeParticle(110, 10), makeParticle(10, 110)], 100);
    expect(sg.count[0]).toBe(1); // particle 0 in cell 0
    expect(sg.count[1]).toBe(1); // particle 1 in cell 1
    expect(sg.count[3]).toBe(1); // particle 2 in cell 3
  });

  it('places multiple particles in the same cell', () => {
    const sg = createSpatialGrid(3, 3, 8);
    rebuildSpatialGrid(sg, [makeParticle(10, 10), makeParticle(20, 20)], 100);
    expect(sg.count[0]).toBe(2);
    expect(sg.data[0]).toBe(0);
    expect(sg.data[1]).toBe(1);
  });

  it('silently drops particles when a cell reaches maxPerCell', () => {
    const sg = createSpatialGrid(2, 2, 2); // maxPerCell = 2
    // Three particles all in cell 0 (x<100, y<100)
    const particles = [makeParticle(5, 5), makeParticle(10, 10), makeParticle(15, 15)];
    rebuildSpatialGrid(sg, particles, 100);
    expect(sg.count[0]).toBe(2); // third particle dropped, not 3
  });

  it('clamps negative x to column 0', () => {
    const sg = createSpatialGrid(3, 3, 8);
    rebuildSpatialGrid(sg, [makeParticle(-50, 50)], 100);
    // col = clamp(floor(-50/100), 0, 2) = 0; row = 0 → cell 0
    expect(sg.count[0]).toBe(1);
  });

  it('clamps x >= width to the last column', () => {
    const sg = createSpatialGrid(3, 3, 8); // cols=3 → valid col: 0,1,2
    // x=350 with cellSize=100 → floor(3.5)=3 → clamped to 2
    rebuildSpatialGrid(sg, [makeParticle(350, 50)], 100);
    // col=2, row=0 → cell index = 0*3+2 = 2
    expect(sg.count[2]).toBe(1);
  });

  it('clamps negative y to row 0', () => {
    const sg = createSpatialGrid(3, 3, 8);
    rebuildSpatialGrid(sg, [makeParticle(50, -20)], 100);
    // col=0, row=clamp(-1,0,2)=0 → cell 0
    expect(sg.count[0]).toBe(1);
  });
});

describe('forEachConnectedPair', () => {
  it('finds a pair within connectDistance in the same cell', () => {
    const particles = [makeParticle(10, 10), makeParticle(20, 10)]; // 10 units apart
    const pairs = gridPairs(particles, 100);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual([0, 1]);
  });

  it('finds a pair within connectDistance across adjacent cells', () => {
    // p0 at x=95 (cell col=0), p1 at x=105 (cell col=1) — 10 units apart, within 100
    const particles = [makeParticle(95, 50), makeParticle(105, 50)];
    const pairs = gridPairs(particles, 100);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual([0, 1]);
  });

  it('does not find a pair beyond connectDistance', () => {
    const particles = [makeParticle(0, 0), makeParticle(200, 0)]; // 200 > 100
    expect(gridPairs(particles, 100)).toHaveLength(0);
  });

  it('emits each pair exactly once (no duplicates)', () => {
    const particles = [
      makeParticle(10, 10),
      makeParticle(20, 10),
      makeParticle(30, 10),
      makeParticle(40, 10),
      makeParticle(50, 10),
    ];
    const pairs = gridPairs(particles, 100);
    const keys = pairs.map(([i, j]) => `${i}-${j}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(pairs.length); // no duplicates
  });

  it('only emits pairs where i < j', () => {
    const particles = [makeParticle(10, 10), makeParticle(20, 10)];
    const pairs = gridPairs(particles, 100);
    for (const [i, j] of pairs) {
      expect(i).toBeLessThan(j);
    }
  });

  it('handles particles at top-left corner (nr<0 and nc<0 boundary checks)', () => {
    // Particle at (0,0) — when dr=-1 and dc=-1, nr=-1 and nc=-1 must be skipped
    const particles = [makeParticle(0, 0), makeParticle(50, 50)];
    expect(() => gridPairs(particles, 100)).not.toThrow();
    expect(gridPairs(particles, 100)).toHaveLength(1);
  });

  it('handles particles at bottom-right corner (nr>=rows and nc>=cols)', () => {
    const w = 400, h = 400;
    const particles = [makeParticle(w - 1, h - 1), makeParticle(w - 50, h - 50)];
    expect(() => gridPairs(particles, 100, w, h)).not.toThrow();
    const pairs = gridPairs(particles, 100, w, h);
    expect(pairs).toHaveLength(1);
  });

  it('returns no pairs for an empty particle array', () => {
    expect(gridPairs([], 100)).toHaveLength(0);
  });

  it('returns no pairs when no particles are within connectDistance', () => {
    const particles = [makeParticle(0, 0), makeParticle(200, 0), makeParticle(0, 200)];
    expect(gridPairs(particles, 100)).toHaveLength(0);
  });

  it('matches brute-force exactly on random-ish layouts', () => {
    // Deterministic "random" positions covering multiple cells and distances
    const positions: [number, number][] = [
      [10, 10], [80, 10], [160, 10],   // row 1: p0-p1 near, p1-p2 near, p0-p2 far
      [10, 80], [80, 80],               // row 2: p3-p4 near; p0-p3 near, p1-p4 near
      [300, 300], [350, 350],           // far cluster: p5-p6 near, far from others
    ];
    const particles = positions.map(([x, y]) => makeParticle(x, y));
    const connectDist = 100;

    const brute = bruteForce(particles, connectDist * connectDist);
    const spatial = gridPairs(particles, connectDist, 500, 500);

    // Sort both so order doesn't matter
    const sortPairs = (arr: [number, number][]) =>
      [...arr].sort(([a0, a1], [b0, b1]) => a0 - b0 || a1 - b1);

    expect(sortPairs(spatial)).toEqual(sortPairs(brute));
  });

  it('matches brute-force on a dense cluster (worst-case for the j<=i skip)', () => {
    // 10 particles all within 50 units of each other → n*(n-1)/2 = 45 pairs
    const particles = Array.from({ length: 10 }, (_, i) => makeParticle(i * 4, i * 4));
    const connectDist = 100;
    const brute = bruteForce(particles, connectDist * connectDist);
    const spatial = gridPairs(particles, connectDist, 200, 200);
    expect(spatial).toHaveLength(brute.length);
  });
});

describe('applyMousePull — extracted pointer physics', () => {
  it('exports named constants for strength and pointer sentinels', () => {
    expect(MOUSE_PULL_STRENGTH).toBe(0.5);
    expect(MOUSE_INACTIVE_POSITION).toBe(-1000);
    expect(MOUSE_ACTIVE_THRESHOLD).toBe(-900);
    // The parked position must read as inactive under the threshold check
    expect(MOUSE_INACTIVE_POSITION).toBeLessThan(MOUSE_ACTIVE_THRESHOLD);
  });

  it('pulls a particle inside the radius toward the pointer, scaled by proximity', () => {
    const near = makeParticle(90, 100);
    const far = makeParticle(500, 500);
    applyMousePull([near, far], 100, 100, 150);

    // near: 10 units away, force = (150-10)/150; moved along +x only
    expect(near.x).toBeCloseTo(90 + ((150 - 10) / 150) * MOUSE_PULL_STRENGTH);
    expect(near.y).toBeCloseTo(100);
    // far: outside the radius — untouched
    expect(far.x).toBe(500);
    expect(far.y).toBe(500);
  });

  it('pulls diagonally (nonzero dx AND dy) with the exact force magnitude', () => {
    // The x-only case above can't distinguish the y-axis arithmetic (dy=0
    // there, so any +/- or */ mutation on the y term is a no-op). A diagonal
    // pull exercises both axes with nonzero deltas.
    const p = makeParticle(90, 90);
    applyMousePull([p], 100, 100, 150);

    const dx = 100 - 90;
    const dy = 100 - 90;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const force = (150 - distance) / 150;
    expect(p.x).toBeCloseTo(90 + (dx / distance) * force * MOUSE_PULL_STRENGTH, 10);
    expect(p.y).toBeCloseTo(90 + (dy / distance) * force * MOUSE_PULL_STRENGTH, 10);
  });

  it('closer particles receive a stronger pull than distant ones', () => {
    const close = makeParticle(95, 100);
    const distant = makeParticle(20, 100);
    applyMousePull([close, distant], 100, 100, 150);
    expect(close.x - 95).toBeGreaterThan(distant.x - 20);
  });

  it('skips a particle exactly at the pointer (d2 === 0 guard, no NaN)', () => {
    const pinned = makeParticle(100, 100);
    applyMousePull([pinned], 100, 100, 150);
    expect(pinned.x).toBe(100);
    expect(pinned.y).toBe(100);
    expect(Number.isNaN(pinned.x)).toBe(false);
  });

  it('respects a custom strength parameter', () => {
    const a = makeParticle(90, 100);
    const b = makeParticle(90, 100);
    applyMousePull([a], 100, 100, 150, 1);
    applyMousePull([b], 100, 100, 150, 0.5);
    expect(a.x - 90).toBeCloseTo((b.x - 90) * 2);
  });
});

describe('BACKGROUND_OPACITY_TIERS — batched draw table', () => {
  it('has exactly three ascending tiers ending at Infinity', () => {
    expect(BACKGROUND_OPACITY_TIERS).toHaveLength(3);
    expect(BACKGROUND_OPACITY_TIERS[2].threshold).toBe(Infinity);
    for (let i = 1; i < BACKGROUND_OPACITY_TIERS.length; i += 1) {
      expect(BACKGROUND_OPACITY_TIERS[i].threshold).toBeGreaterThan(BACKGROUND_OPACITY_TIERS[i - 1].threshold);
    }
  });

  it('partitions the full opacity oscillation range of advanceBackgroundParticle (0.1–0.6)', () => {
    // Every opacity a particle can reach falls into exactly one tier bucket
    for (const opacity of [0.1, 0.29, 0.3, 0.44, 0.45, 0.59, 0.6]) {
      let bucket = -1;
      let prev = 0;
      for (let i = 0; i < BACKGROUND_OPACITY_TIERS.length; i += 1) {
        if (opacity > prev && opacity <= BACKGROUND_OPACITY_TIERS[i].threshold) {
          bucket = i;
          break;
        }
        prev = BACKGROUND_OPACITY_TIERS[i].threshold;
      }
      expect(bucket, `opacity ${opacity} must land in a tier`).toBeGreaterThanOrEqual(0);
    }
  });
});
