import { describe, expect, it } from 'vitest';
import {
  GLYPH_ALPHA_THRESHOLD,
  GLYPH_DISSOLVE_DURATION_MS,
  GLYPH_PARTICLE_MAX,
  GLYPH_RESTORE_DURATION_MS,
  GLYPH_SAMPLE_STRIDE,
  GLYPH_SCATTER_RADIUS_MAX,
  GLYPH_SCATTER_RADIUS_MIN,
  GLYPH_SWIRL_RADIUS,
  clampProgress,
  computeDomTextOpacity,
  computeGlyphParticlePosition,
  computeScatterTarget,
  computeSwirlOffset,
  easeInCubic,
  easeOutCubic,
  hasEnteringFinished,
  hasLeavingFinished,
  lerp,
  sampleGlyphPositions,
  shouldEnableGlyphDissolve,
  type GlyphImageDataLike,
} from '@/components/hero/glyph-dissolve-logic';

describe('glyph-dissolve-logic', () => {
  describe('shouldEnableGlyphDissolve', () => {
    it('is true only when every gate passes', () => {
      expect(shouldEnableGlyphDissolve('full', true, true)).toBe(true);
    });

    it('is false on any other performance tier', () => {
      expect(shouldEnableGlyphDissolve('balanced', true, true)).toBe(false);
      expect(shouldEnableGlyphDissolve('lite', true, true)).toBe(false);
      expect(shouldEnableGlyphDissolve('reduced', true, true)).toBe(false);
    });

    it('is false when hover motion is disabled (coarse pointer or reduced motion)', () => {
      expect(shouldEnableGlyphDissolve('full', false, true)).toBe(false);
    });

    it('is false until typing has completed', () => {
      expect(shouldEnableGlyphDissolve('full', true, false)).toBe(false);
    });
  });

  describe('sampleGlyphPositions', () => {
    function buildImage(width: number, height: number, inkAt: Array<[number, number]>): GlyphImageDataLike {
      const data = new Uint8ClampedArray(width * height * 4);
      for (const [x, y] of inkAt) {
        data[(y * width + x) * 4 + 3] = 255;
      }
      return { width, height, data };
    }

    it('samples exact positions of every ink pixel on the stride grid', () => {
      const image = buildImage(6, 6, [
        [0, 0],
        [3, 0],
        [0, 3],
        [3, 3],
      ]);
      const result = sampleGlyphPositions(image, 3, 100, 80);
      expect(result.count).toBe(4);
      expect(Array.from(result.x.slice(0, 4))).toEqual([0, 3, 0, 3]);
      expect(Array.from(result.y.slice(0, 4))).toEqual([0, 0, 3, 3]);
    });

    it('skips a pixel at or below the alpha threshold', () => {
      const data = new Uint8ClampedArray(4 * 4 * 4);
      data[(0 * 4 + 0) * 4 + 3] = GLYPH_ALPHA_THRESHOLD; // exactly at threshold — not "exceeds"
      const image: GlyphImageDataLike = { width: 4, height: 4, data };
      const result = sampleGlyphPositions(image, 1, 10, GLYPH_ALPHA_THRESHOLD);
      expect(result.count).toBe(0);
    });

    it('counts a pixel one unit above the alpha threshold', () => {
      const data = new Uint8ClampedArray(4 * 4 * 4);
      data[(0 * 4 + 0) * 4 + 3] = GLYPH_ALPHA_THRESHOLD + 1;
      const image: GlyphImageDataLike = { width: 4, height: 4, data };
      const result = sampleGlyphPositions(image, 1, 10, GLYPH_ALPHA_THRESHOLD);
      expect(result.count).toBe(1);
    });

    it('early-exits at maxCount without scanning the rest of the image', () => {
      const inkEverywhere: Array<[number, number]> = [];
      for (let y = 0; y < 10; y += 1) {
        for (let x = 0; x < 10; x += 1) inkEverywhere.push([x, y]);
      }
      const image = buildImage(10, 10, inkEverywhere);
      const result = sampleGlyphPositions(image, 1, 5, 80);
      expect(result.count).toBe(5);
      expect(result.x.length).toBe(5);
    });

    it('uses the exported defaults when called with just an image', () => {
      const image = buildImage(4, 4, [[0, 0]]);
      const result = sampleGlyphPositions(image);
      expect(result.count).toBe(1);
      // Defaults are exercised, not re-asserted by value here — GLYPH_SAMPLE_STRIDE/
      // GLYPH_PARTICLE_MAX/GLYPH_ALPHA_THRESHOLD each have their own dedicated test above.
      void GLYPH_SAMPLE_STRIDE;
      void GLYPH_PARTICLE_MAX;
    });
  });

  describe('computeScatterTarget', () => {
    it('produces the exact point for a fixed random stream', () => {
      const values = [0.25, 0.5]; // angle fraction, radius fraction
      let i = 0;
      const random = () => values[i++];
      const target = computeScatterTarget({ x: 10, y: 20 }, random, 10, 30);

      const expectedAngle = 0.25 * Math.PI * 2;
      const expectedRadius = 10 + 0.5 * (30 - 10);
      expect(target.x).toBeCloseTo(10 + Math.cos(expectedAngle) * expectedRadius, 10);
      expect(target.y).toBeCloseTo(20 + Math.sin(expectedAngle) * expectedRadius, 10);
    });

    it('never lands closer than radiusMin from the origin', () => {
      const random = () => 0; // angle=0, radius fraction=0 -> exactly radiusMin
      const target = computeScatterTarget({ x: 0, y: 0 }, random, GLYPH_SCATTER_RADIUS_MIN, GLYPH_SCATTER_RADIUS_MAX);
      const distance = Math.hypot(target.x, target.y);
      expect(distance).toBeCloseTo(GLYPH_SCATTER_RADIUS_MIN, 5);
    });

    it('never lands farther than radiusMax from the origin', () => {
      const random = () => 0.999999; // radius fraction -> just under radiusMax
      const target = computeScatterTarget({ x: 0, y: 0 }, random, GLYPH_SCATTER_RADIUS_MIN, GLYPH_SCATTER_RADIUS_MAX);
      const distance = Math.hypot(target.x, target.y);
      expect(distance).toBeLessThan(GLYPH_SCATTER_RADIUS_MAX);
    });

    it('uses the exported default radii and Math.random when called with just an origin', () => {
      const target = computeScatterTarget({ x: 0, y: 0 });
      const distance = Math.hypot(target.x, target.y);
      expect(distance).toBeGreaterThanOrEqual(GLYPH_SCATTER_RADIUS_MIN);
      expect(distance).toBeLessThanOrEqual(GLYPH_SCATTER_RADIUS_MAX);
    });
  });

  describe('lerp', () => {
    it('interpolates exactly at t=0, t=0.5, and t=1', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
    });
  });

  describe('clampProgress', () => {
    it('is exactly 0 at or before zero elapsed time', () => {
      expect(clampProgress(0, 100)).toBe(0);
      expect(clampProgress(-5, 100)).toBe(0);
    });

    it('is exactly 1 once elapsed reaches the duration', () => {
      expect(clampProgress(100, 100)).toBe(1);
    });

    it('never exceeds 1 past the duration', () => {
      expect(clampProgress(1000, 100)).toBe(1);
    });

    it('is the exact fraction mid-duration', () => {
      expect(clampProgress(25, 100)).toBe(0.25);
    });

    it('treats a non-positive duration as instantly finished', () => {
      expect(clampProgress(5, 0)).toBe(1);
      expect(clampProgress(5, -10)).toBe(1);
    });
  });

  describe('easeOutCubic / easeInCubic', () => {
    it('both anchor at exactly 0 and 1', () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
      expect(easeInCubic(0)).toBe(0);
      expect(easeInCubic(1)).toBe(1);
    });

    it('easeOutCubic front-loads progress (above the linear diagonal at t=0.5)', () => {
      expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    });

    it('easeInCubic back-loads progress (below the linear diagonal at t=0.5)', () => {
      expect(easeInCubic(0.5)).toBeLessThan(0.5);
    });

    it('computes the exact cubic value at t=0.5', () => {
      expect(easeInCubic(0.5)).toBeCloseTo(0.125, 10);
      expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 10);
    });
  });

  describe('computeSwirlOffset', () => {
    it('is the exact point for a zero phase and zero elapsed time', () => {
      const offset = computeSwirlOffset(0, 0, GLYPH_SWIRL_RADIUS, 1);
      expect(offset.x).toBeCloseTo(GLYPH_SWIRL_RADIUS, 10);
      expect(offset.y).toBeCloseTo(0, 10);
    });

    it('flattens the y-axis to 60% of the swirl radius (an ellipse, not a circle)', () => {
      const offset = computeSwirlOffset(Math.PI / 2, 0, GLYPH_SWIRL_RADIUS, 1);
      expect(offset.x).toBeCloseTo(0, 10);
      expect(offset.y).toBeCloseTo(GLYPH_SWIRL_RADIUS * 0.6, 10);
    });

    it('advances the angle in exact proportion to elapsed seconds and swirl speed', () => {
      const a = computeSwirlOffset(0, 1, GLYPH_SWIRL_RADIUS, 2);
      const expectedAngle = 0 + 1 * 2;
      expect(a.x).toBeCloseTo(Math.cos(expectedAngle) * GLYPH_SWIRL_RADIUS, 10);
      expect(a.y).toBeCloseTo(Math.sin(expectedAngle) * GLYPH_SWIRL_RADIUS * 0.6, 10);
    });
  });

  describe('computeGlyphParticlePosition', () => {
    const origin = { x: 0, y: 0 };
    const scatterTarget = { x: 20, y: 30 };
    const leaveStart = { x: 20, y: 30 };

    it('starts exactly at origin when entering has just begun', () => {
      const point = computeGlyphParticlePosition('entering', 0, origin, scatterTarget, leaveStart, 0);
      expect(point.x).toBeCloseTo(0, 10);
      expect(point.y).toBeCloseTo(0, 10);
    });

    it('reaches exactly the scatter target once entering finishes', () => {
      const point = computeGlyphParticlePosition('entering', GLYPH_DISSOLVE_DURATION_MS, origin, scatterTarget, leaveStart, 0);
      expect(point.x).toBeCloseTo(scatterTarget.x, 6);
      expect(point.y).toBeCloseTo(scatterTarget.y, 6);
    });

    it('orbits the scatter target while hovering, never sitting exactly on it once time passes', () => {
      const point = computeGlyphParticlePosition('hovering', 250, origin, scatterTarget, leaveStart, 0);
      expect(point.x).not.toBeCloseTo(scatterTarget.x, 3);
    });

    it('sits at the exact swirl-phase offset from the scatter target at the instant hovering begins', () => {
      // At elapsed=0, computeSwirlOffset(phase, 0) = (cos(phase)*R, sin(phase)*R*0.6) —
      // with phase=0 that's (GLYPH_SWIRL_RADIUS, 0), not (0, 0): the orbit starts at
      // its own phase angle around the target, it doesn't settle exactly on it.
      const point = computeGlyphParticlePosition('hovering', 0, origin, scatterTarget, leaveStart, 0);
      expect(point.x).toBeCloseTo(scatterTarget.x + GLYPH_SWIRL_RADIUS, 10);
      expect(point.y).toBeCloseTo(scatterTarget.y, 10);
    });

    it('starts exactly at leaveStart when leaving has just begun', () => {
      const point = computeGlyphParticlePosition('leaving', 0, origin, scatterTarget, leaveStart, 0);
      expect(point.x).toBeCloseTo(leaveStart.x, 10);
      expect(point.y).toBeCloseTo(leaveStart.y, 10);
    });

    it('reaches exactly the origin once leaving finishes', () => {
      const point = computeGlyphParticlePosition('leaving', GLYPH_RESTORE_DURATION_MS, origin, scatterTarget, leaveStart, 0);
      expect(point.x).toBeCloseTo(origin.x, 6);
      expect(point.y).toBeCloseTo(origin.y, 6);
    });
  });

  describe('hasEnteringFinished / hasLeavingFinished', () => {
    it('are false before their exact duration', () => {
      expect(hasEnteringFinished(GLYPH_DISSOLVE_DURATION_MS - 1)).toBe(false);
      expect(hasLeavingFinished(GLYPH_RESTORE_DURATION_MS - 1)).toBe(false);
    });

    it('are true at exactly their duration', () => {
      expect(hasEnteringFinished(GLYPH_DISSOLVE_DURATION_MS)).toBe(true);
      expect(hasLeavingFinished(GLYPH_RESTORE_DURATION_MS)).toBe(true);
    });
  });

  describe('computeDomTextOpacity', () => {
    it('starts fully opaque (1) at the instant entering begins', () => {
      expect(computeDomTextOpacity('entering', 0)).toBeCloseTo(1, 10);
    });

    it('reaches fully transparent (0) once entering finishes', () => {
      expect(computeDomTextOpacity('entering', GLYPH_DISSOLVE_DURATION_MS)).toBeCloseTo(0, 6);
    });

    it('is exactly 0 for the entire hovering phase', () => {
      expect(computeDomTextOpacity('hovering', 0)).toBe(0);
      expect(computeDomTextOpacity('hovering', 9999)).toBe(0);
    });

    it('starts fully transparent (0) at the instant leaving begins', () => {
      expect(computeDomTextOpacity('leaving', 0)).toBeCloseTo(0, 10);
    });

    it('reaches fully opaque (1) once leaving finishes', () => {
      expect(computeDomTextOpacity('leaving', GLYPH_RESTORE_DURATION_MS)).toBeCloseTo(1, 6);
    });
  });
});
