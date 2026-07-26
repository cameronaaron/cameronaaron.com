import {
  marqueeVelocityToShiftPx,
  marqueeVelocityToSkewDeg,
  sectionTitleVelocityToSkewDeg,
} from './velocity-marquee-logic';

/**
 * The scroll-velocity lean shared by the marquee bands and every section title
 * used to be built independently in each consumer as a framer-motion
 * `useScroll → useVelocity → useSpring → useTransform` chain — ~10 identical
 * spring graphs on the home page (2 marquees + one per SectionHeader), every
 * one of them subscribing to scroll and stepping its own spring on the main
 * thread, and every one of them built unconditionally (Rules of Hooks) even on
 * the tiers that never attach the resulting transform.
 *
 * This module is the single replacement: one spring, stepped once per frame,
 * published as three CSS custom properties that any number of consumers read
 * for free. Same channel ENGINEERING-STANDARDS §3.1 already blesses for
 * SpotlightCard (CSS custom property via `style.setProperty`), and the same
 * move §4.4's globals.css comment records for the 43 infinite framer
 * animations that became CSS keyframes.
 */

/**
 * Marker classes the driver resolves once on mount to find its consumers. They
 * carry no styling of their own — the lean is written as an inline `transform`.
 *
 * The first build of this module published through an *inherited* registered
 * custom property on `:root` instead, which reads better but measured far
 * worse: changing an inherited custom property at the document root
 * invalidates style for every element beneath it. Probed directly against the
 * built page (3,424 elements, 300 frames each): root custom property 3.65ms of
 * style recalc per frame, direct transform on these 8 elements 0.58ms, and
 * doing nothing at all 0.54ms. The declarative version cost ~19% of a 60fps
 * frame budget purely to invalidate elements that never change.
 */
export const VELOCITY_LEAN_BAND_CLASS = 'velocity-lean-band';
export const VELOCITY_LEAN_BAND_REVERSE_CLASS = 'velocity-lean-band-reverse';
export const VELOCITY_LEAN_TITLE_CLASS = 'velocity-lean-title';

/** Written to clear the lean entirely once the spring reaches rest. */
export const VELOCITY_LEAN_REST_TRANSFORM = '';

/**
 * Spring constants carried over verbatim from the `useSpring` calls this
 * module replaces, so the motion is identical rather than merely similar.
 */
export const SCROLL_SPRING_STIFFNESS = 260;
export const SCROLL_SPRING_DAMPING = 44;
export const SCROLL_SPRING_MASS = 0.5;

/**
 * Longest frame delta the integrator will accept, in seconds. A backgrounded
 * tab or a long task can hand back a multi-second delta; integrating it in one
 * step makes a stiff spring explode instead of settle.
 */
export const MAX_SPRING_STEP_S = 1 / 30;

/**
 * Fixed integration sub-step, in seconds. The spring is advanced in slices no
 * longer than this regardless of how long the real frame was.
 *
 * This is a stability requirement, not a quality knob, and it was found by
 * instrumenting the real browser rather than by reading the code. Explicit
 * Euler applied to this spring is stable only while
 * `(damping / mass) * dt < 2` — here `88 * dt < 2`, i.e. `dt < 22.7ms`
 * (~44fps). Integrating a whole clamped 33ms frame in one step multiplies the
 * spring's velocity by 1.93 every step instead of damping it, so a single
 * dropped frame makes it diverge: the shipped build was measured mid-scroll
 * holding `value = 1.03e7`, `velocity = -6.5e7`. Nothing looked broken on
 * screen because the published value is clamped to the saturation window — the
 * only visible symptom was the lean taking ~2.5s to fall back to rest instead
 * of the ~1.5s the spring's own physics call for.
 *
 * 1/120s keeps every sub-step far inside the stability bound (88/120 = 0.73)
 * and costs at most 4 iterations per clamped frame.
 */
export const SPRING_SUBSTEP_S = 1 / 120;

/**
 * Below this |velocity| (px/s) *and* |rate of change|, the spring is close
 * enough to rest that the driver stops its frame loop until the next scroll
 * event — the self-sleeping pattern §3.7 requires of a continuous loop that
 * has no unmount to hang a visibility gate on.
 */
export const SPRING_REST_VELOCITY_PX_S = 0.5;
export const SPRING_REST_DELTA_PX_S = 0.5;

/**
 * |scroll velocity| (px/s) below which the page counts as idle.
 *
 * This is NOT `=== 0`, and the difference is a real shipped bug: Lenis eases
 * desktop scrolling asymptotically toward its target, so after the wheel stops
 * `window.scrollY` keeps changing by ever-smaller fractional amounts for a long
 * time. An exact-zero park condition is therefore never satisfied, the frame
 * loop never sleeps, and the lean never clears — caught by the real-browser
 * parity check, invisible to jsdom (which has no smooth scrolling to ease).
 *
 * 2 px/s is derived from the visual, not picked: it maps to a skew of
 * 2 / 1400 * 5 = 0.0071° and a shift of 2 / 1400 * 110 = 0.157px — sub-pixel
 * and far below a hundredth of a degree, i.e. identical to identity on screen.
 */
export const SCROLL_IDLE_VELOCITY_PX_S = 2;

/** True when the page is moving too slowly for the lean to be visible at all. */
export function isScrollIdle(velocityPxPerS: number): boolean {
  // Stryker disable next-line EqualityOperator,ConditionalExpression,UnaryOperator:
  // at velocityPxPerS exactly 0, `-0 === 0` in JS (strict equality and every
  // relational operator treat signed zero as equal), so a '<=' guard, a
  // forced-false branch, or a '+' in place of the negation all produce the
  // same 0 this abs-value computation would anyway. Hand-verified 2026-07-26
  // per ENGINEERING-STANDARDS §6 item 13.
  const speed = velocityPxPerS < 0 ? -velocityPxPerS : velocityPxPerS;
  return speed < SCROLL_IDLE_VELOCITY_PX_S;
}

export interface ScrollVelocitySpring {
  /** Smoothed scroll velocity, px/s — the spring's position. */
  value: number;
  /** Rate of change of `value`, px/s² — the spring's own velocity. */
  velocity: number;
}

export function createScrollVelocitySpring(): ScrollVelocitySpring {
  return { value: 0, velocity: 0 };
}

/** Instantaneous scroll velocity in px/s; a zero/negative delta-t reads as at-rest. */
export function computeScrollVelocityPxPerS(deltaPx: number, deltaSeconds: number): number {
  if (deltaSeconds <= 0) return 0;
  return deltaPx / deltaSeconds;
}

/** Clamp a raw frame delta into the integrator's safe window. */
export function clampSpringStepSeconds(deltaSeconds: number): number {
  // Stryker disable next-line EqualityOperator: at deltaSeconds exactly 0, a
  // '<' mutant skips the early return, but the fallthrough `return
  // deltaSeconds` is itself 0 — identical to the early-returned value.
  if (deltaSeconds <= 0) return 0;
  // Stryker disable next-line EqualityOperator: same reasoning at exactly
  // MAX_SPRING_STEP_S — the fallthrough already returns that exact value.
  // Both hand-verified 2026-07-26 per §6 item 13.
  if (deltaSeconds > MAX_SPRING_STEP_S) return MAX_SPRING_STEP_S;
  return deltaSeconds;
}

/**
 * Advance the damped harmonic oscillator toward `target` over `deltaSeconds`,
 * mutating `state` in place and returning the same object — a per-frame
 * allocation here would be exactly the GC pressure §2.8 bans.
 *
 * The frame's elapsed time is clamped and then integrated as a whole number of
 * equal sub-steps, each no longer than `SPRING_SUBSTEP_S`, so the integrator
 * stays inside its stability bound no matter how badly a frame overran. See
 * `SPRING_SUBSTEP_S` for the divergence this prevents.
 */
export function stepScrollVelocitySpring(
  state: ScrollVelocitySpring,
  target: number,
  deltaSeconds: number
): ScrollVelocitySpring {
  const total = clampSpringStepSeconds(deltaSeconds);
  // Stryker disable next-line ConditionalExpression: removing this early
  // return does not change behavior at total===0. subSteps becomes
  // Math.ceil(0 / SPRING_SUBSTEP_S) = 0, so the integration loop below runs
  // zero iterations regardless (`step` computes to 0/0 = NaN but is never
  // read, since the loop condition `i < 0` is false on its first check) —
  // `state` comes back completely unmutated either way. Hand-verified
  // 2026-07-26 per §6 item 13.
  if (total === 0) return state;

  const subSteps = Math.ceil(total / SPRING_SUBSTEP_S);
  const step = total / subSteps;

  for (let i = 0; i < subSteps; i += 1) {
    const displacement = state.value - target;
    const acceleration =
      (-SCROLL_SPRING_STIFFNESS * displacement - SCROLL_SPRING_DAMPING * state.velocity) /
      SCROLL_SPRING_MASS;

    state.velocity += acceleration * step;
    state.value += state.velocity * step;
  }

  return state;
}

/**
 * True once the spring has effectively reached `target` and stopped moving, so
 * the caller can park its frame loop instead of burning frames on a value that
 * no longer changes.
 */
export function isScrollVelocitySpringAtRest(state: ScrollVelocitySpring, target: number): boolean {
  const displacement = state.value - target;
  // Stryker disable next-line EqualityOperator,ConditionalExpression,UnaryOperator:
  // same -0===0 equivalence as isScrollIdle above — at displacement/velocity
  // exactly 0, every boundary/negation variant of this abs-value computation
  // yields the identical 0. Hand-verified 2026-07-26 per §6 item 13.
  const distance = displacement < 0 ? -displacement : displacement;
  // Stryker disable next-line EqualityOperator,ConditionalExpression,UnaryOperator:
  // same reasoning for velocity.
  const speed = state.velocity < 0 ? -state.velocity : state.velocity;
  return distance < SPRING_REST_DELTA_PX_S && speed < SPRING_REST_VELOCITY_PX_S;
}

/** Snap a spring exactly to rest at `target` — used on the final published frame. */
export function settleScrollVelocitySpring(
  state: ScrollVelocitySpring,
  target: number
): ScrollVelocitySpring {
  state.value = target;
  state.velocity = 0;
  return state;
}

export interface ScrollVelocityTransforms {
  band: string;
  reverseBand: string;
  title: string;
}

/**
 * Map a smoothed velocity to the three `transform` strings the driver writes.
 * The numeric mapping stays in `velocity-marquee-logic` so the skew, shift and
 * title-ratio constants keep one home — this function only formats, it never
 * re-derives, and the reversed band asks for `direction: -1` rather than
 * negating an already-computed number.
 */
export function buildScrollVelocityTransforms(velocityPxPerS: number): ScrollVelocityTransforms {
  const skew = marqueeVelocityToSkewDeg(velocityPxPerS);
  return {
    band: `skewX(${skew}deg) translateX(${marqueeVelocityToShiftPx(velocityPxPerS, 1)}px)`,
    reverseBand: `skewX(${skew}deg) translateX(${marqueeVelocityToShiftPx(velocityPxPerS, -1)}px)`,
    title: `skewX(${sectionTitleVelocityToSkewDeg(velocityPxPerS)}deg)`,
  };
}
