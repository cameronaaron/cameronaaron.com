import {
  type BurstParticle,
  PARTICLE_COLORS,
} from '@/components/hero/interactive-particles/engine';

/** Hard cap on live sparks — the ring buffer never grows past this. */
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

/** Sparks emitted across the viewport when an aurora surge fires. */
export const SURGE_SPARK_COUNT = 130;
export const SURGE_SPARK_MIN_SPEED = 0.8;
export const SURGE_SPARK_SPEED_JITTER = 2.6;
export const SURGE_SPARK_SIZE_MIN = 1.8;
export const SURGE_SPARK_SIZE_JITTER = 2.8;

/** Per-frame life decay (matches the hero burst engine's cadence). */
export const SPARK_LIFE_DECAY = 0.03;
/** Per-frame velocity damping. */
export const SPARK_VELOCITY_DAMPING = 0.985;

/**
 * Fixed-size ring of spark objects, ALL allocated once by createSparkPool.
 * Emission overwrites the oldest slot in place and steady-state stepping
 * mutates fields — a moving-pointer frame allocates nothing (ENGINEERING-
 * STANDARDS §2.8). `liveCount` is recomputed each step so the render loop can
 * sleep when the trail has fully burned out.
 */
export interface SparkPool {
  sparks: BurstParticle[];
  writeIndex: number;
  liveCount: number;
}

export function createSparkPool(size = MAX_TRAIL_SPARKS): SparkPool {
  const sparks: BurstParticle[] = Array.from({ length: size }, (_, id) => ({
    id,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    size: 0,
    color: PARTICLE_COLORS[0],
  }));
  return { sparks, writeIndex: 0, liveCount: 0 };
}

/** How many sparks a pointer move of `distancePx` earns this frame. */
export function getSparkEmitCount(distancePx: number): number {
  return Math.min(TRAIL_EMIT_CAP_PER_FRAME, Math.floor(distancePx / TRAIL_EMIT_SPACING_PX));
}

/** Overwrite the next ring slot in place (zero allocation) and advance. */
function writeSpark(
  pool: SparkPool,
  x: number,
  y: number,
  angle: number,
  speed: number,
  size: number,
  color: string
): void {
  const slot = pool.sparks[pool.writeIndex];
  slot.x = x;
  slot.y = y;
  slot.vx = Math.cos(angle) * speed;
  slot.vy = Math.sin(angle) * speed;
  slot.life = 1;
  slot.size = size;
  slot.color = color;
  pool.writeIndex = (pool.writeIndex + 1) % pool.sparks.length;
}

/**
 * Comet dust: emit `count` sparks opposite the motion direction, mutating
 * pooled slots in place. In px space, sharing BurstParticle so the render
 * loop draws them like the hero engine's bursts.
 */
export function emitTrailSparks(
  pool: SparkPool,
  args: { baseX: number; baseY: number; dirX: number; dirY: number; count: number; random?: () => number }
): void {
  const random = args.random ?? Math.random;
  const baseAngle = Math.atan2(-args.dirY, -args.dirX);
  for (let i = 0; i < args.count; i += 1) {
    const angle = baseAngle + (random() - 0.5) * TRAIL_SPARK_SPREAD_RAD;
    const speed = TRAIL_SPARK_MIN_SPEED + random() * TRAIL_SPARK_SPEED_JITTER;
    const size = TRAIL_SPARK_SIZE_MIN + random() * TRAIL_SPARK_SIZE_JITTER;
    writeSpark(pool, args.baseX, args.baseY, angle, speed, size, PARTICLE_COLORS[Math.floor(random() * PARTICLE_COLORS.length)]);
  }
}

/** Aurora-surge storm: sparks at random viewport positions, radial velocity. */
export function emitSurgeBurst(
  pool: SparkPool,
  args: { width: number; height: number; count: number; random?: () => number }
): void {
  const random = args.random ?? Math.random;
  for (let i = 0; i < args.count; i += 1) {
    const angle = random() * Math.PI * 2;
    const speed = SURGE_SPARK_MIN_SPEED + random() * SURGE_SPARK_SPEED_JITTER;
    const size = SURGE_SPARK_SIZE_MIN + random() * SURGE_SPARK_SIZE_JITTER;
    writeSpark(pool, random() * args.width, random() * args.height, angle, speed, size, PARTICLE_COLORS[Math.floor(random() * PARTICLE_COLORS.length)]);
  }
}

/**
 * Decay + advance every live spark in place and recompute liveCount. Iterates
 * the fixed-size pool (bounded constant work), allocates nothing.
 */
export function stepSparkPool(pool: SparkPool, step: number): void {
  let live = 0;
  for (const spark of pool.sparks) {
    // Stryker disable next-line ConditionalExpression,EqualityOperator:
    // life is only ever exactly 1 (fresh), a positive fraction (decaying), or
    // exactly 0 (clamped dead by the `nextLife <= 0` branch below — decay is
    // strictly subtractive, so life can never go negative through normal
    // pool lifecycle). At life===0 specifically, skipping this guard entirely
    // (or narrowing it to '<0') doesn't change anything observable: the
    // fallthrough computes nextLife = 0 - DECAY*step < 0, which the second
    // guard clamps back to exactly 0 and `continue`s anyway — same end state,
    // same `live` count (not incremented either way). Hand-verified: both
    // replacing this condition with `false` and narrowing it to `< 0` leave
    // the full cursor-comet + interaction-layer suites passing bit-for-bit.
    if (spark.life <= 0) continue;
    const nextLife = spark.life - SPARK_LIFE_DECAY * step;
    if (nextLife <= 0) {
      spark.life = 0;
      continue;
    }
    spark.x += spark.vx * step;
    spark.y += spark.vy * step;
    spark.vx *= SPARK_VELOCITY_DAMPING;
    spark.vy *= SPARK_VELOCITY_DAMPING;
    spark.life = nextLife;
    live += 1;
  }
  pool.liveCount = live;
}
