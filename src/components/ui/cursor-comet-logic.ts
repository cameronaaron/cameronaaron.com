import {
  type BurstParticle,
  PARTICLE_COLORS,
} from '@/components/hero/interactive-particles/engine';

/** Hard cap on live sparks — appendBursts truncates the oldest past this. */
export const MAX_TRAIL_SPARKS = 180;

/** One spark per this many px of pointer travel, up to the per-frame cap. */
export const TRAIL_EMIT_SPACING_PX = 9;
export const TRAIL_EMIT_CAP_PER_FRAME = 4;

export const TRAIL_SPARK_MIN_SPEED = 0.5;
export const TRAIL_SPARK_SPEED_JITTER = 1.9;
export const TRAIL_SPARK_SIZE_MIN = 1.4;
export const TRAIL_SPARK_SIZE_JITTER = 2.2;
/** Radians of random spread around the anti-motion direction. */
export const TRAIL_SPARK_SPREAD_RAD = 1.2;

/** Sparks spawned across the viewport when an aurora surge fires. */
export const SURGE_SPARK_COUNT = 130;
export const SURGE_SPARK_MIN_SPEED = 0.8;
export const SURGE_SPARK_SPEED_JITTER = 2.6;
export const SURGE_SPARK_SIZE_MIN = 1.8;
export const SURGE_SPARK_SIZE_JITTER = 2.8;

/** How many sparks a pointer move of `distancePx` earns this frame. */
export function getSparkEmitCount(distancePx: number): number {
  return Math.min(TRAIL_EMIT_CAP_PER_FRAME, Math.floor(distancePx / TRAIL_EMIT_SPACING_PX));
}

/**
 * Comet dust: sparks shed opposite to the motion direction with jittered
 * spread, in px space. Shares the BurstParticle shape so stepBursts /
 * appendBursts from the hero engine run them unchanged.
 */
export function createTrailSparks(args: {
  baseX: number;
  baseY: number;
  dirX: number;
  dirY: number;
  count: number;
  startId: number;
  random?: () => number;
}): BurstParticle[] {
  const random = args.random ?? Math.random;
  const baseAngle = Math.atan2(-args.dirY, -args.dirX);

  return Array.from({ length: args.count }, (_, i) => {
    const angle = baseAngle + (random() - 0.5) * TRAIL_SPARK_SPREAD_RAD;
    const speed = TRAIL_SPARK_MIN_SPEED + random() * TRAIL_SPARK_SPEED_JITTER;

    return {
      id: args.startId + i,
      x: args.baseX,
      y: args.baseY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: TRAIL_SPARK_SIZE_MIN + random() * TRAIL_SPARK_SIZE_JITTER,
      color: PARTICLE_COLORS[Math.floor(random() * PARTICLE_COLORS.length)],
    };
  });
}

/** Aurora-surge storm: sparks at random viewport positions, radial velocity. */
export function createSurgeSparks(args: {
  width: number;
  height: number;
  count: number;
  startId: number;
  random?: () => number;
}): BurstParticle[] {
  const random = args.random ?? Math.random;

  return Array.from({ length: args.count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const speed = SURGE_SPARK_MIN_SPEED + random() * SURGE_SPARK_SPEED_JITTER;

    return {
      id: args.startId + i,
      x: random() * args.width,
      y: random() * args.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: SURGE_SPARK_SIZE_MIN + random() * SURGE_SPARK_SIZE_JITTER,
      color: PARTICLE_COLORS[Math.floor(random() * PARTICLE_COLORS.length)],
    };
  });
}
