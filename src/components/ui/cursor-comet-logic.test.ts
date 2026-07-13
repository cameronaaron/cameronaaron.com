import { describe, expect, it } from 'vitest';

import { PARTICLE_COLORS } from '@/components/hero/interactive-particles/engine';
import {
  MAX_TRAIL_SPARKS,
  SURGE_SPARK_COUNT,
  TRAIL_EMIT_CAP_PER_FRAME,
  TRAIL_EMIT_SPACING_PX,
  TRAIL_SPARK_MIN_SPEED,
  TRAIL_SPARK_SPEED_JITTER,
  createSurgeSparks,
  createTrailSparks,
  getSparkEmitCount,
} from './cursor-comet-logic';

const fixedRandom = () => 0.5;

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

describe('createTrailSparks', () => {
  it('spawns the requested count at the base position with sequential ids', () => {
    const sparks = createTrailSparks({
      baseX: 120,
      baseY: 300,
      dirX: 10,
      dirY: 0,
      count: 3,
      startId: 7,
      random: fixedRandom,
    });

    expect(sparks).toHaveLength(3);
    expect(sparks.map((spark) => spark.id)).toEqual([7, 8, 9]);
    for (const spark of sparks) {
      expect(spark.x).toBe(120);
      expect(spark.y).toBe(300);
      expect(spark.life).toBe(1);
      expect(PARTICLE_COLORS).toContain(spark.color);
    }
  });

  it('sheds sparks opposite to the motion direction', () => {
    // Moving right (dirX > 0) with zero jitter offset → sparks fly left.
    const [spark] = createTrailSparks({
      baseX: 0,
      baseY: 0,
      dirX: 10,
      dirY: 0,
      count: 1,
      startId: 0,
      random: fixedRandom,
    });

    expect(spark.vx).toBeLessThan(0);
    const speed = Math.sqrt(spark.vx * spark.vx + spark.vy * spark.vy);
    expect(speed).toBeGreaterThanOrEqual(TRAIL_SPARK_MIN_SPEED);
    expect(speed).toBeLessThanOrEqual(TRAIL_SPARK_MIN_SPEED + TRAIL_SPARK_SPEED_JITTER);
  });
});

describe('createSurgeSparks', () => {
  it('scatters sparks inside the viewport with live colors', () => {
    const sparks = createSurgeSparks({
      width: 800,
      height: 600,
      count: 20,
      startId: 100,
      random: fixedRandom,
    });

    expect(sparks).toHaveLength(20);
    for (const spark of sparks) {
      expect(spark.x).toBeGreaterThanOrEqual(0);
      expect(spark.x).toBeLessThanOrEqual(800);
      expect(spark.y).toBeGreaterThanOrEqual(0);
      expect(spark.y).toBeLessThanOrEqual(600);
      expect(spark.life).toBe(1);
      expect(PARTICLE_COLORS).toContain(spark.color);
    }
  });
});

describe('spark budget', () => {
  it('keeps the surge storm inside the pool cap', () => {
    expect(SURGE_SPARK_COUNT).toBeLessThanOrEqual(MAX_TRAIL_SPARKS);
  });
});
