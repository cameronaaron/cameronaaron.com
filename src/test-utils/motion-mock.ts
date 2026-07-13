/**
 * Pure helpers behind vitest.setup.ts's framer-motion mock — extracted so the
 * test infrastructure itself is modular and unit-tested (motion-mock.test.ts
 * pins the interpolation math directly, and test-quality-contract.test.ts
 * verifies the assembled mock end-to-end through the real `framer-motion`
 * import). History: the pre-extraction inline mock silently froze
 * useTransform at creation time for months, which made every motion-math
 * assertion in the suite unwritable — nothing tested the mock, so nothing
 * could catch it (2026-07).
 *
 * Framework-agnostic on purpose: no vitest imports, so the module stays
 * importable from anywhere and its own tests exercise exactly what
 * production-test code consumes.
 */

export interface MockMotionValue<T = unknown> {
  get: () => T;
  set: (next: T) => void;
  on: (...args: unknown[]) => void;
}

const noop = () => undefined;

/** A writable motion value — the mock's stand-in for framer's useMotionValue. */
export function createMotionValue<T>(initial: T): MockMotionValue<T> {
  let current = initial;
  return {
    get: () => current,
    set: (next: T) => {
      current = next;
    },
    on: noop,
  };
}

/** Unwrap a motion-value-like object to its current value; pass everything
 *  else through untouched. */
export function readMotionValue(value: unknown): unknown {
  if (value && typeof value === 'object' && 'get' in value && typeof (value as { get: () => unknown }).get === 'function') {
    return (value as { get: () => unknown }).get();
  }
  return value;
}

/** A derived motion value that recomputes from its live inputs on every
 *  .get() — so tests can drive a source value (pointer position, scroll)
 *  and assert the real transformed output, not a snapshot frozen at
 *  creation time. */
export function createComputedMotionValue(compute: () => unknown): MockMotionValue {
  return {
    get: compute,
    set: noop,
    on: noop,
  };
}

/** Piecewise-linear interpolation matching framer-motion's range form,
 *  clamped at both ends (framer clamps by default). */
export function interpolateRange(value: number, inputRange: number[], outputRange: number[]): number {
  if (value <= inputRange[0]) return outputRange[0];
  const lastIndex = inputRange.length - 1;
  if (value >= inputRange[lastIndex]) return outputRange[lastIndex];

  let segment = 1;
  while (inputRange[segment] < value) segment += 1;

  const t = (value - inputRange[segment - 1]) / (inputRange[segment] - inputRange[segment - 1]);
  return outputRange[segment - 1] + t * (outputRange[segment] - outputRange[segment - 1]);
}

/** Resolve motion-value objects inside a style prop to their live values,
 *  the way real framer-motion writes computed numbers to the DOM. Keeps
 *  derived-value callbacks executing at render under lazy evaluation, and
 *  lets tests assert rendered styles numerically instead of seeing
 *  "[object Object]". Non-object styles pass through untouched. */
export function resolveMotionStyle(style: unknown): unknown {
  if (!style || typeof style !== 'object') return style;

  const resolved: Record<string, unknown> = {};
  for (const [property, value] of Object.entries(style as Record<string, unknown>)) {
    resolved[property] = readMotionValue(value);
  }
  return resolved;
}
