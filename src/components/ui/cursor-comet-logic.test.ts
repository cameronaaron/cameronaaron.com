import { describe, expect, it } from 'vitest';

import { PARTICLE_COLORS } from '@/components/hero/interactive-particles/engine';
import {
  MAX_TRAIL_SPARKS,
  SPARK_LIFE_DECAY,
  SURGE_SPARK_COUNT,
  TRAIL_EMIT_CAP_PER_FRAME,
  TRAIL_EMIT_SPACING_PX,
  TRAIL_SPARK_MIN_SPEED,
  TRAIL_SPARK_SPEED_JITTER,
  createSparkPool,
  emitSurgeBurst,
  emitTrailSparks,
  getSparkEmitCount,
  stepSparkPool,
} from './cursor-comet-logic';

const fixedRandom = () => 0.5;

/** Deterministic random() sequence, cycling through explicit values. */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('createSparkPool', () => {
  it('pre-allocates a full ring of dead spark slots', () => {
    const pool = createSparkPool();
    expect(pool.sparks).toHaveLength(MAX_TRAIL_SPARKS);
    expect(pool.writeIndex).toBe(0);
    expect(pool.liveCount).toBe(0);
    for (const spark of pool.sparks) {
      expect(spark.life).toBe(0);
    }
  });

  it('honours a custom size', () => {
    expect(createSparkPool(12).sparks).toHaveLength(12);
  });
});

describe('getSparkEmitCount', () => {
  it('earns one spark per spacing unit of travel', () => {
    expect(getSparkEmitCount(0)).toBe(0);
    expect(getSparkEmitCount(TRAIL_EMIT_SPACING_PX - 0.01)).toBe(0);
    expect(getSparkEmitCount(TRAIL_EMIT_SPACING_PX)).toBe(1);
    expect(getSparkEmitCount(TRAIL_EMIT_SPACING_PX * 2.5)).toBe(2);
  });

  it('caps the per-frame emission regardless of distance', () => {
    expect(getSparkEmitCount(10_000)).toBe(TRAIL_EMIT_CAP_PER_FRAME);
  });
});

describe('emitTrailSparks', () => {
  it('revives ring slots in place without growing the pool or allocating', () => {
    const pool = createSparkPool(8);
    const sameArray = pool.sparks;

    emitTrailSparks(pool, { baseX: 120, baseY: 300, dirX: 10, dirY: 0, count: 3, random: fixedRandom });

    // Same backing array (no reallocation), ring advanced by 3.
    expect(pool.sparks).toBe(sameArray);
    expect(pool.writeIndex).toBe(3);
    for (let i = 0; i < 3; i += 1) {
      expect(pool.sparks[i].life).toBe(1);
      expect(pool.sparks[i].x).toBe(120);
      expect(pool.sparks[i].y).toBe(300);
      expect(PARTICLE_COLORS).toContain(pool.sparks[i].color);
    }
    // Untouched slots stay dead.
    expect(pool.sparks[3].life).toBe(0);
  });

  it('sheds sparks opposite to the motion direction, within the speed band', () => {
    const pool = createSparkPool(4);
    // Moving right (dirX > 0), zero jitter → the spark flies left.
    emitTrailSparks(pool, { baseX: 0, baseY: 0, dirX: 10, dirY: 0, count: 1, random: fixedRandom });

    const spark = pool.sparks[0];
    expect(spark.vx).toBeLessThan(0);
    const speed = Math.sqrt(spark.vx * spark.vx + spark.vy * spark.vy);
    expect(speed).toBeGreaterThanOrEqual(TRAIL_SPARK_MIN_SPEED);
    expect(speed).toBeLessThanOrEqual(TRAIL_SPARK_MIN_SPEED + TRAIL_SPARK_SPEED_JITTER);
  });

  it('computes the exact velocity, size, and colour from a non-constant random sequence', () => {
    // fixedRandom()=0.5 is a poison value for this formula: (0.5-0.5)*SPREAD
    // is 0 regardless of the spread arithmetic, and a nonzero dirY is needed
    // so the atan2 sign term is actually exercised. This pins the full
    // formula chain (spread angle, speed jitter, size jitter, colour index,
    // and the cos/sin*speed velocity projection) at once.
    const pool = createSparkPool(2);
    const random = seq([0.8, 0.3, 0.6, 0.9]);
    emitTrailSparks(pool, { baseX: 0, baseY: 0, dirX: 3, dirY: 4, count: 1, random });
    const spark = pool.sparks[0];
    expect(spark.vx).toBeCloseTo(-0.2992990171177568, 10);
    expect(spark.vy).toBeCloseTo(-1.02728773883092, 10);
    expect(spark.size).toBeCloseTo(2.7199999999999998, 10);
    expect(spark.color).toBe(PARTICLE_COLORS[3]);
  });

  it('reflects the anti-motion angle across both axes, not just X (dirY sign matters)', () => {
    // dirX=0 isolates the Y-axis: with dirX=0, dirY>0 the pointer moves down,
    // so the trail (anti-motion) must fly up (vy<0). A mutant that drops the
    // negation on dirY inside atan2 would flip this to vy>0.
    const pool = createSparkPool(2);
    emitTrailSparks(pool, { baseX: 0, baseY: 0, dirX: 0, dirY: 5, count: 1, random: fixedRandom });
    expect(pool.sparks[0].vy).toBeLessThan(0);
  });

  it('wraps the ring, overwriting the oldest slots', () => {
    const pool = createSparkPool(3);
    emitTrailSparks(pool, { baseX: 1, baseY: 1, dirX: 1, dirY: 0, count: 3, random: fixedRandom });
    expect(pool.writeIndex).toBe(0);
    emitTrailSparks(pool, { baseX: 99, baseY: 99, dirX: 1, dirY: 0, count: 1, random: fixedRandom });
    expect(pool.sparks[0].x).toBe(99);
    expect(pool.writeIndex).toBe(1);
  });
});

describe('emitSurgeBurst', () => {
  it('scatters sparks inside the viewport via the same ring', () => {
    const pool = createSparkPool();
    emitSurgeBurst(pool, { width: 800, height: 600, count: 20, random: fixedRandom });

    let revived = 0;
    for (const spark of pool.sparks) {
      if (spark.life <= 0) continue;
      revived += 1;
      expect(spark.x).toBeGreaterThanOrEqual(0);
      expect(spark.x).toBeLessThanOrEqual(800);
      expect(spark.y).toBeGreaterThanOrEqual(0);
      expect(spark.y).toBeLessThanOrEqual(600);
    }
    expect(revived).toBe(20);
  });

  it('keeps the surge storm inside the pool cap', () => {
    expect(SURGE_SPARK_COUNT).toBeLessThanOrEqual(MAX_TRAIL_SPARKS);
  });

  it('computes the exact position, velocity, size, and colour from a non-constant random sequence', () => {
    const pool = createSparkPool(2);
    const random = seq([1 / 12, 0.4, 0.7, 0.6, 0.2, 0.5]);
    emitSurgeBurst(pool, { width: 800, height: 600, count: 1, random });
    const spark = pool.sparks[0];
    expect(spark.x).toBe(480); // 0.6 * 800
    expect(spark.y).toBe(120); // 0.2 * 600
    expect(spark.vx).toBeCloseTo(1.5934867429633672, 10);
    expect(spark.vy).toBeCloseTo(0.9199999999999999, 10);
    expect(spark.size).toBeCloseTo(3.76, 10);
    expect(spark.color).toBe(PARTICLE_COLORS[2]);
  });
});

describe('stepSparkPool', () => {
  it('decays life, moves live sparks, and recomputes liveCount', () => {
    const pool = createSparkPool(4);
    emitTrailSparks(pool, { baseX: 10, baseY: 10, dirX: 1, dirY: 0, count: 2, random: fixedRandom });

    const beforeX = pool.sparks[0].x;
    stepSparkPool(pool, 1);

    expect(pool.liveCount).toBe(2);
    expect(pool.sparks[0].life).toBeLessThan(1);
    expect(pool.sparks[0].life).toBeGreaterThan(0);
    expect(pool.sparks[0].x).not.toBe(beforeX);
  });

  it('reports zero live once every spark has fully decayed', () => {
    const pool = createSparkPool(4);
    emitTrailSparks(pool, { baseX: 10, baseY: 10, dirX: 1, dirY: 0, count: 2, random: fixedRandom });

    // Enough steps to exhaust life (decay 0.03/step → ~34 steps).
    for (let i = 0; i < 40; i += 1) stepSparkPool(pool, 1);

    expect(pool.liveCount).toBe(0);
    for (const spark of pool.sparks) {
      expect(spark.life).toBe(0);
    }
  });

  it('advances position and damps velocity by the exact amount, on both axes, with step != 1', () => {
    // step=1 (used elsewhere) can't tell x += vx*step from x += vx/step.
    // dirX=1, dirY=1 gives a nonzero vy too (dirX-only motion collapses vy
    // to ~0 via atan2, which can't distinguish a vy-formula mutant).
    const pool = createSparkPool(2);
    emitTrailSparks(pool, { baseX: 10, baseY: 20, dirX: 1, dirY: 1, count: 1, random: fixedRandom });
    stepSparkPool(pool, 2);
    const spark = pool.sparks[0];
    expect(spark.x).toBeCloseTo(7.949390334559013, 10);
    expect(spark.y).toBeCloseTo(17.949390334559013, 10);
    expect(spark.vx).toBeCloseTo(-1.0099252602296864, 10);
    expect(spark.vy).toBeCloseTo(-1.0099252602296864, 10);
    expect(spark.life).toBeCloseTo(0.94, 10); // 1 - SPARK_LIFE_DECAY*2
  });

  it('skips an already-dead spark (life exactly 0) without moving it', () => {
    const pool = createSparkPool(1);
    pool.sparks[0].life = 0;
    pool.sparks[0].x = 5;
    pool.sparks[0].vx = 999; // would move a lot if the skip guard failed
    stepSparkPool(pool, 1);
    expect(pool.sparks[0].x).toBe(5);
    expect(pool.liveCount).toBe(0);
  });

  it('clamps to exactly 0 (not a small negative) when life decays to exactly the boundary', () => {
    const pool = createSparkPool(1);
    pool.sparks[0].life = SPARK_LIFE_DECAY; // nextLife = life - DECAY*1 === 0 exactly
    pool.sparks[0].x = 1;
    pool.sparks[0].vx = 100; // would move if the clamp branch didn't fire first
    stepSparkPool(pool, 1);
    expect(pool.sparks[0].life).toBe(0);
    expect(pool.sparks[0].x).toBe(1); // untouched — the clamp branch continues before moving
    expect(pool.liveCount).toBe(0);
  });

  it('allocates nothing across a step — the backing array identity is stable', () => {
    const pool = createSparkPool(4);
    emitTrailSparks(pool, { baseX: 0, baseY: 0, dirX: 1, dirY: 0, count: 1, random: fixedRandom });
    const sameArray = pool.sparks;
    const sameSlot = pool.sparks[0];
    stepSparkPool(pool, 1);
    expect(pool.sparks).toBe(sameArray);
    expect(pool.sparks[0]).toBe(sameSlot);
  });
});
