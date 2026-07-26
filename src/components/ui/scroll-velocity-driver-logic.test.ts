import { describe, expect, it } from 'vitest';

import {
  MAX_SPRING_STEP_S,
  SPRING_SUBSTEP_S,
  SCROLL_SPRING_DAMPING,
  SCROLL_SPRING_MASS,
  SCROLL_SPRING_STIFFNESS,
  SCROLL_IDLE_VELOCITY_PX_S,
  SPRING_REST_DELTA_PX_S,
  SPRING_REST_VELOCITY_PX_S,
  VELOCITY_LEAN_BAND_CLASS,
  VELOCITY_LEAN_BAND_REVERSE_CLASS,
  VELOCITY_LEAN_REST_TRANSFORM,
  VELOCITY_LEAN_TITLE_CLASS,
  buildScrollVelocityTransforms,
  clampSpringStepSeconds,
  isScrollIdle,
  computeScrollVelocityPxPerS,
  createScrollVelocitySpring,
  isScrollVelocitySpringAtRest,
  settleScrollVelocitySpring,
  stepScrollVelocitySpring,
} from './scroll-velocity-driver-logic';

describe('scroll-velocity-driver-logic', () => {
  describe('consumer marker classes', () => {
    // Asserted against hardcoded literals, never against the re-imported
    // constant: a mutant that empties the constant empties both sides of a
    // self-referential comparison at once and can never be caught
    // (ENGINEERING-STANDARDS §6 item 13, the PAUSED_CAPTION lesson).
    it('names the three classes the driver queries for', () => {
      expect(VELOCITY_LEAN_BAND_CLASS).toBe('velocity-lean-band');
      expect(VELOCITY_LEAN_BAND_REVERSE_CLASS).toBe('velocity-lean-band-reverse');
      expect(VELOCITY_LEAN_TITLE_CLASS).toBe('velocity-lean-title');
    });

    it('clears the lean with an empty transform rather than an identity one', () => {
      expect(VELOCITY_LEAN_REST_TRANSFORM).toBe('');
    });

    it('carries the exact spring constants the replaced useSpring calls used', () => {
      expect(SCROLL_SPRING_STIFFNESS).toBe(260);
      expect(SCROLL_SPRING_DAMPING).toBe(44);
      expect(SCROLL_SPRING_MASS).toBe(0.5);
    });
  });

  describe('createScrollVelocitySpring', () => {
    it('starts at rest with both components exactly zero', () => {
      expect(createScrollVelocitySpring()).toEqual({ value: 0, velocity: 0 });
    });

    it('returns an independent object per call', () => {
      const first = createScrollVelocitySpring();
      const second = createScrollVelocitySpring();
      first.value = 42;
      expect(second.value).toBe(0);
    });
  });

  describe('computeScrollVelocityPxPerS', () => {
    it('divides the pixel delta by the time delta', () => {
      // Asymmetric operands so a '*' → '/' mutant cannot produce the same
      // number: 24 / 0.5 = 48, but 24 * 0.5 = 12.
      expect(computeScrollVelocityPxPerS(24, 0.5)).toBe(48);
    });

    it('keeps the sign of an upward (negative) scroll delta', () => {
      expect(computeScrollVelocityPxPerS(-24, 0.5)).toBe(-48);
    });

    it('reads a zero time delta as at-rest rather than dividing by zero', () => {
      expect(computeScrollVelocityPxPerS(24, 0)).toBe(0);
    });

    it('reads a negative time delta as at-rest', () => {
      expect(computeScrollVelocityPxPerS(24, -0.5)).toBe(0);
    });
  });

  describe('clampSpringStepSeconds', () => {
    it('passes a normal frame delta through untouched', () => {
      expect(clampSpringStepSeconds(0.016)).toBe(0.016);
    });

    it('caps a long delta at the integrator ceiling', () => {
      expect(clampSpringStepSeconds(4)).toBe(MAX_SPRING_STEP_S);
      expect(MAX_SPRING_STEP_S).toBe(1 / 30);
    });

    it('passes the ceiling itself through unclamped (inclusive boundary)', () => {
      expect(clampSpringStepSeconds(MAX_SPRING_STEP_S)).toBe(MAX_SPRING_STEP_S);
    });

    it('reads zero and negative deltas as no step', () => {
      expect(clampSpringStepSeconds(0)).toBe(0);
      expect(clampSpringStepSeconds(-0.016)).toBe(0);
    });
  });

  describe('stepScrollVelocitySpring', () => {
    it('integrates a single sub-step to an exact value', () => {
      // One sub-step exactly, so the arithmetic is fully determined:
      // displacement = 0 - 100 = -100
      // acceleration = (-260 * -100 - 44 * 0) / 0.5 = 52000
      // velocity     = 0 + 52000 / 120 = 433.3333…
      // value        = 0 + 433.3333… / 120 = 3.6111…
      const spring = createScrollVelocitySpring();
      stepScrollVelocitySpring(spring, 100, SPRING_SUBSTEP_S);
      expect(spring.velocity).toBeCloseTo(52000 / 120, 9);
      expect(spring.value).toBeCloseTo(52000 / 120 / 120, 9);
    });

    it('damps a moving spring that is already at its target', () => {
      // displacement 0, so acceleration is pure damping:
      // (-260 * 0 - 44 * 100) / 0.5 = -8800 → velocity = 100 - 8800/120
      const spring = { value: 50, velocity: 100 };
      stepScrollVelocitySpring(spring, 50, SPRING_SUBSTEP_S);
      expect(spring.velocity).toBeCloseTo(100 - 8800 / 120, 9);
      expect(spring.value).toBeCloseTo(50 + (100 - 8800 / 120) / 120, 9);
    });

    it('splits a long frame into sub-steps instead of integrating it whole', () => {
      // Two sub-steps in one call must equal two single-sub-step calls.
      const oneCall = createScrollVelocitySpring();
      stepScrollVelocitySpring(oneCall, 100, SPRING_SUBSTEP_S * 2);

      const twoCalls = createScrollVelocitySpring();
      stepScrollVelocitySpring(twoCalls, 100, SPRING_SUBSTEP_S);
      stepScrollVelocitySpring(twoCalls, 100, SPRING_SUBSTEP_S);

      expect(oneCall.value).toBeCloseTo(twoCalls.value, 9);
      expect(oneCall.velocity).toBeCloseTo(twoCalls.velocity, 9);
    });

    it('pins the sub-step inside the integrator’s stability bound', () => {
      // Explicit Euler is stable for this spring only while
      // (damping / mass) * dt < 2. Assert the margin rather than the prose.
      expect((SCROLL_SPRING_DAMPING / SCROLL_SPRING_MASS) * SPRING_SUBSTEP_S).toBeLessThan(2);
    });

    it('converges instead of diverging when every frame is a long one', () => {
      // Regression pin for a real shipped defect: integrating a whole clamped
      // 1/30s frame in one step amplifies the spring's velocity by 1.93x per
      // step. The live build was measured mid-scroll at value 1.03e7,
      // velocity -6.5e7. Simulate three seconds of nothing but worst-case
      // frames and require monotone-ish decay to rest.
      const spring = { value: 7500, velocity: 0 };
      let peak = 0;
      for (let i = 0; i < 90; i += 1) {
        stepScrollVelocitySpring(spring, 0, MAX_SPRING_STEP_S);
        peak = Math.max(peak, Math.abs(spring.value));
      }
      expect(Number.isFinite(spring.value)).toBe(true);
      // Never blows past its own starting amplitude…
      expect(peak).toBeLessThanOrEqual(7500);
      // …and lands at rest well inside the park threshold.
      expect(Math.abs(spring.value)).toBeLessThan(SPRING_REST_DELTA_PX_S);
      expect(Math.abs(spring.velocity)).toBeLessThan(SPRING_REST_VELOCITY_PX_S);
    });

    it('mutates in place and returns the same object — no per-frame allocation', () => {
      const spring = createScrollVelocitySpring();
      expect(stepScrollVelocitySpring(spring, 100, 0.01)).toBe(spring);
    });

    it('leaves the state untouched when the step clamps to zero', () => {
      const spring = { value: 7, velocity: 3 };
      expect(stepScrollVelocitySpring(spring, 100, 0)).toBe(spring);
      expect(spring).toEqual({ value: 7, velocity: 3 });
    });

    it('clamps an oversized delta instead of integrating it whole', () => {
      const clamped = createScrollVelocitySpring();
      const capped = createScrollVelocitySpring();
      stepScrollVelocitySpring(clamped, 100, 10);
      stepScrollVelocitySpring(capped, 100, MAX_SPRING_STEP_S);
      expect(clamped).toEqual(capped);
    });
  });

  describe('isScrollVelocitySpringAtRest', () => {
    it('reports rest when both distance and speed are inside the thresholds', () => {
      expect(isScrollVelocitySpringAtRest({ value: 0.4, velocity: 0.4 }, 0)).toBe(true);
    });

    it('treats the distance threshold as exclusive', () => {
      expect(isScrollVelocitySpringAtRest({ value: SPRING_REST_DELTA_PX_S, velocity: 0 }, 0)).toBe(false);
    });

    it('treats the speed threshold as exclusive', () => {
      expect(isScrollVelocitySpringAtRest({ value: 0, velocity: SPRING_REST_VELOCITY_PX_S }, 0)).toBe(false);
    });

    it('measures distance and speed as magnitudes, not signed values', () => {
      expect(isScrollVelocitySpringAtRest({ value: -0.4, velocity: -0.4 }, 0)).toBe(true);
      expect(isScrollVelocitySpringAtRest({ value: -2, velocity: -2 }, 0)).toBe(false);
    });

    it('measures distance against the target, not against zero', () => {
      expect(isScrollVelocitySpringAtRest({ value: 900, velocity: 0 }, 900)).toBe(true);
      expect(isScrollVelocitySpringAtRest({ value: 900, velocity: 0 }, 0)).toBe(false);
    });

    it('pins both thresholds to their documented values', () => {
      expect(SPRING_REST_DELTA_PX_S).toBe(0.5);
      expect(SPRING_REST_VELOCITY_PX_S).toBe(0.5);
    });
  });

  describe('isScrollIdle', () => {
    // Regression pin: an exact `=== 0` idle test shipped once and never let the
    // frame loop park, because Lenis eases scrollY asymptotically — the lean
    // stayed applied forever on desktop.
    it('treats a Lenis easing tail as idle even though it is not exactly zero', () => {
      expect(isScrollIdle(0.4)).toBe(true);
      expect(isScrollIdle(-0.4)).toBe(true);
      expect(isScrollIdle(1.99)).toBe(true);
    });

    it('does not treat real scrolling as idle', () => {
      expect(isScrollIdle(50)).toBe(false);
      expect(isScrollIdle(-50)).toBe(false);
    });

    it('treats the threshold itself as not-idle (exclusive boundary)', () => {
      expect(isScrollIdle(SCROLL_IDLE_VELOCITY_PX_S)).toBe(false);
      expect(isScrollIdle(-SCROLL_IDLE_VELOCITY_PX_S)).toBe(false);
    });

    it('pins the threshold, and pins that it stays visually invisible', () => {
      expect(SCROLL_IDLE_VELOCITY_PX_S).toBe(2);
      // The justification for the number, asserted rather than only asserted in
      // prose: at the threshold the lean must be far below one pixel and one
      // hundredth of a degree.
      const atThreshold = buildScrollVelocityTransforms(SCROLL_IDLE_VELOCITY_PX_S);
      expect(Number.parseFloat(atThreshold.title.slice('skewX('.length))).toBeLessThan(0.01);
      expect(Math.abs(Number.parseFloat(atThreshold.band.split('translateX(')[1]))).toBeLessThan(1);
    });
  });

  describe('settleScrollVelocitySpring', () => {
    it('snaps value to the target and zeroes the velocity', () => {
      const spring = { value: 3, velocity: 17 };
      settleScrollVelocitySpring(spring, 900);
      expect(spring).toEqual({ value: 900, velocity: 0 });
    });

    it('mutates in place and returns the same object', () => {
      const spring = createScrollVelocitySpring();
      expect(settleScrollVelocitySpring(spring, 5)).toBe(spring);
    });
  });

  describe('buildScrollVelocityTransforms', () => {
    it('formats a mid-range velocity to exact transform strings', () => {
      // 700/1400 = 0.5 → skew 0.5*5 = 2.5deg; shift 0.5*110*-1 = -55px;
      // title 2.5*0.55 = 1.375deg
      expect(buildScrollVelocityTransforms(700)).toEqual({
        band: 'skewX(2.5deg) translateX(-55px)',
        reverseBand: 'skewX(2.5deg) translateX(55px)',
        title: 'skewX(1.375deg)',
      });
    });

    it('saturates at the velocity clamp rather than growing without bound', () => {
      expect(buildScrollVelocityTransforms(9000)).toEqual({
        band: 'skewX(5deg) translateX(-110px)',
        reverseBand: 'skewX(5deg) translateX(110px)',
        title: 'skewX(2.75deg)',
      });
    });

    it('saturates symmetrically for upward scrolling', () => {
      expect(buildScrollVelocityTransforms(-9000)).toEqual({
        band: 'skewX(-5deg) translateX(110px)',
        reverseBand: 'skewX(-5deg) translateX(-110px)',
        title: 'skewX(-2.75deg)',
      });
    });

    it('lurches the two bands in opposite directions at the same skew', () => {
      const { band, reverseBand } = buildScrollVelocityTransforms(700);
      expect(band).toBe('skewX(2.5deg) translateX(-55px)');
      expect(reverseBand).toBe('skewX(2.5deg) translateX(55px)');
    });

    it('produces identity transforms at rest', () => {
      expect(buildScrollVelocityTransforms(0)).toEqual({
        band: 'skewX(0deg) translateX(0px)',
        reverseBand: 'skewX(0deg) translateX(0px)',
        title: 'skewX(0deg)',
      });
    });

    it('leans the title less than the band it shares a graph with', () => {
      const { band, title } = buildScrollVelocityTransforms(700);
      const degrees = (transform: string) => Number.parseFloat(transform.slice('skewX('.length));
      expect(degrees(title)).toBeLessThan(degrees(band));
    });
  });
});
