import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

/**
 * Pure math for the Hero name's hover-dissolve effect. GlyphDissolveName.tsx
 * owns DOM/canvas concerns only (measuring, sampling via getImageData,
 * requestAnimationFrame bookkeeping); every formula that decides WHERE a
 * particle sits at a given moment lives here so it can be pinned with
 * exact-value tests independent of jsdom's limited canvas support.
 */

// ── Tunables — no magic numbers in the component (complexity doctrine) ──────

/** Upper bound on sampled particles — a portfolio hover flourish, not a demo reel. */
export const GLYPH_PARTICLE_MAX = 320;
/** Pixel stride when scanning the offscreen glyph render for "ink". */
export const GLYPH_SAMPLE_STRIDE = 3;
/** Alpha (0-255) a sampled pixel must exceed to count as glyph ink. */
export const GLYPH_ALPHA_THRESHOLD = 80;
/** Scatter distance band (px) a particle travels away from its origin on hover. */
export const GLYPH_SCATTER_RADIUS_MIN = 14;
export const GLYPH_SCATTER_RADIUS_MAX = 42;
/** Gentle orbit applied to a settled, scattered particle while still hovering. */
export const GLYPH_SWIRL_RADIUS = 4;
export const GLYPH_SWIRL_SPEED = 1.6; // radians / second
/** Hover-enter (dissolve out) / hover-leave (restore) animation lengths. */
export const GLYPH_DISSOLVE_DURATION_MS = 420;
export const GLYPH_RESTORE_DURATION_MS = 380;
/** Drawn particle radius, in canvas px. */
export const GLYPH_PARTICLE_RADIUS_PX = 1.4;
/** Solid fill for every particle — set once per frame, never rebuilt per particle. */
export const GLYPH_PARTICLE_FILL_STYLE = 'rgba(165, 243, 252, 0.85)';

export type GlyphAnimationPhase = 'entering' | 'hovering' | 'leaving';

export interface Point2D {
  x: number;
  y: number;
}

export interface GlyphImageDataLike {
  width: number;
  height: number;
  /** RGBA bytes; alpha for pixel (x, y) is at index (y * width + x) * 4 + 3. */
  data: ArrayLike<number>;
}

export interface SampledGlyphPositions {
  x: Float32Array;
  y: Float32Array;
  count: number;
}

/**
 * Gate for the whole effect: only the `full` performance tier, only when
 * hover motion is enabled (desktop fine-pointer, not `prefers-reduced-motion`
 * — see useInteractionMode), and only once the name has finished typing.
 * A single pure predicate keeps every call site (component render, tests)
 * checking the exact same rule.
 */
export function shouldEnableGlyphDissolve(
  performanceTier: PerformanceTier,
  enableHoverMotion: boolean,
  hasTypingCompleted: boolean
): boolean {
  return performanceTier === 'full' && enableHoverMotion && hasTypingCompleted;
}

/**
 * Scan an offscreen render of the glyphs for "ink" pixels and return their
 * positions, early-exiting the moment `maxCount` is reached (never builds a
 * bigger buffer than needed and slices it down). Deterministic for a fixed
 * input — the same ImageData-like buffer always yields the same positions.
 */
export function sampleGlyphPositions(
  image: GlyphImageDataLike,
  stride: number = GLYPH_SAMPLE_STRIDE,
  maxCount: number = GLYPH_PARTICLE_MAX,
  alphaThreshold: number = GLYPH_ALPHA_THRESHOLD
): SampledGlyphPositions {
  const x = new Float32Array(maxCount);
  const y = new Float32Array(maxCount);
  let count = 0;

  scan: for (let py = 0; py < image.height; py += stride) {
    for (let px = 0; px < image.width; px += stride) {
      if (count >= maxCount) break scan;
      const alphaIndex = (py * image.width + px) * 4 + 3;
      if (image.data[alphaIndex] > alphaThreshold) {
        x[count] = px;
        y[count] = py;
        count += 1;
      }
    }
  }

  return { x, y, count };
}

/**
 * One randomized scatter target for a particle leaving `origin` — an angle
 * plus a radius within [radiusMin, radiusMax]. Accepts an injectable `random`
 * (default Math.random) so tests can assert exact output for a fixed stream,
 * the same pattern as interactive-particles engine's createBurstParticles.
 */
export function computeScatterTarget(
  origin: Point2D,
  random: () => number = Math.random,
  radiusMin: number = GLYPH_SCATTER_RADIUS_MIN,
  radiusMax: number = GLYPH_SCATTER_RADIUS_MAX
): Point2D {
  const angle = random() * Math.PI * 2;
  const radius = radiusMin + random() * (radiusMax - radiusMin);
  return {
    x: origin.x + Math.cos(angle) * radius,
    y: origin.y + Math.sin(angle) * radius,
  };
}

/** Linear interpolation — the shared building block for both animation legs. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp elapsed/duration to [0, 1]; a non-positive duration is instantly "done". */
export function clampProgress(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  if (elapsedMs <= 0) return 0;
  return Math.min(1, elapsedMs / durationMs);
}

/** Decelerating ease — used while particles fly outward on hover-enter. */
export function easeOutCubic(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

/** Accelerating ease — used while particles snap back to origin on hover-leave. */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/**
 * Small orbital drift applied to a settled scatter position while the
 * pointer stays over the name. `phase` is a per-particle constant offset
 * (so particles don't all orbit in lockstep); `elapsedSeconds` is time since
 * the hover settled.
 */
export function computeSwirlOffset(
  phase: number,
  elapsedSeconds: number,
  swirlRadius: number = GLYPH_SWIRL_RADIUS,
  swirlSpeed: number = GLYPH_SWIRL_SPEED
): Point2D {
  const angle = phase + elapsedSeconds * swirlSpeed;
  return {
    x: Math.cos(angle) * swirlRadius,
    y: Math.sin(angle) * swirlRadius * 0.6,
  };
}

/**
 * The single per-particle-per-frame position formula. Given which leg of the
 * hover lifecycle is active and how long it has run, returns where that
 * particle draws this frame. The component's frame loop calls this once per
 * particle per frame (O(1), no allocation beyond the returned point) and
 * writes the result into its reused Float32Arrays.
 */
export function computeGlyphParticlePosition(
  phaseKind: GlyphAnimationPhase,
  elapsedMs: number,
  origin: Point2D,
  scatterTarget: Point2D,
  leaveStart: Point2D,
  swirlPhase: number
): Point2D {
  if (phaseKind === 'entering') {
    const t = easeOutCubic(clampProgress(elapsedMs, GLYPH_DISSOLVE_DURATION_MS));
    return { x: lerp(origin.x, scatterTarget.x, t), y: lerp(origin.y, scatterTarget.y, t) };
  }

  if (phaseKind === 'hovering') {
    const swirl = computeSwirlOffset(swirlPhase, elapsedMs / 1000);
    return { x: scatterTarget.x + swirl.x, y: scatterTarget.y + swirl.y };
  }

  const t = easeInCubic(clampProgress(elapsedMs, GLYPH_RESTORE_DURATION_MS));
  return { x: lerp(leaveStart.x, origin.x, t), y: lerp(leaveStart.y, origin.y, t) };
}

/** True once the entering leg's eased progress has reached 1 (time to hold/hover). */
export function hasEnteringFinished(elapsedMs: number): boolean {
  return clampProgress(elapsedMs, GLYPH_DISSOLVE_DURATION_MS) >= 1;
}

/** True once the leaving leg's eased progress has reached 1 (time to unmount the canvas). */
export function hasLeavingFinished(elapsedMs: number): boolean {
  return clampProgress(elapsedMs, GLYPH_RESTORE_DURATION_MS) >= 1;
}

/**
 * DOM text opacity during the entering/leaving legs, derived from the exact
 * same eased progress used to move the particles — the real text fades out
 * as the particles fly apart, and fades back in as they reassemble, so the
 * canvas and DOM text are never both fully opaque at once.
 */
export function computeDomTextOpacity(phaseKind: GlyphAnimationPhase, elapsedMs: number): number {
  if (phaseKind === 'entering') {
    return 1 - easeOutCubic(clampProgress(elapsedMs, GLYPH_DISSOLVE_DURATION_MS));
  }
  if (phaseKind === 'hovering') {
    return 0;
  }
  return easeInCubic(clampProgress(elapsedMs, GLYPH_RESTORE_DURATION_MS));
}
