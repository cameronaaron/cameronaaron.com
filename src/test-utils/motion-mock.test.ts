import { describe, expect, it } from 'vitest';
import {
  createComputedMotionValue,
  createMotionValue,
  interpolateRange,
  readMotionValue,
  resolveMotionStyle,
} from './motion-mock';

const noopListener = () => undefined;

describe('createMotionValue', () => {
  it('stores and returns the live value through get/set', () => {
    const value = createMotionValue(5);
    expect(value.get()).toBe(5);
    value.set(9);
    expect(value.get()).toBe(9);
  });
});

describe('readMotionValue', () => {
  it('unwraps a motion-value-like object to its current value', () => {
    const value = createMotionValue('hello');
    expect(readMotionValue(value)).toBe('hello');
  });

  it('passes primitives, null, and plain objects through untouched', () => {
    expect(readMotionValue(42)).toBe(42);
    expect(readMotionValue(null)).toBeNull();
    expect(readMotionValue(undefined)).toBeUndefined();
    const plain = { color: 'red' };
    expect(readMotionValue(plain)).toBe(plain);
  });
});

describe('createComputedMotionValue', () => {
  it('set and on are safe no-ops — a derived value cannot be written or subscribed', () => {
    // Real framer throws if you set() a transformed value; the mock's
    // contract is softer (silently ignore) but must never crash a test
    // that wires generic motion-value plumbing to a derived value.
    const derived = createComputedMotionValue(() => 7);
    expect(() => derived.set(99)).not.toThrow();
    expect(() => derived.on('change', noopListener)).not.toThrow();
    expect(derived.get()).toBe(7); // set() had no effect

    const source = createMotionValue(1);
    expect(() => source.on('change', noopListener)).not.toThrow();
  });

  it('recomputes from live inputs on every get — never a frozen snapshot', () => {
    // This exact laziness is what the original inline mock lacked: it
    // snapshotted at creation, making every downstream assertion meaningless.
    const source = createMotionValue(1);
    const doubled = createComputedMotionValue(() => (readMotionValue(source) as number) * 2);

    expect(doubled.get()).toBe(2);
    source.set(21);
    expect(doubled.get()).toBe(42);
  });
});

describe('interpolateRange', () => {
  it('maps the midpoint of a two-point range linearly', () => {
    expect(interpolateRange(0.5, [0, 1], [10, -10])).toBe(0);
    expect(interpolateRange(0.9, [0, 1], [10, -10])).toBeCloseTo(-8);
  });

  it('clamps below the input range to the first output', () => {
    expect(interpolateRange(-5, [0, 1], [10, -10])).toBe(10);
  });

  it('clamps above the input range to the last output', () => {
    expect(interpolateRange(99, [0, 1], [10, -10])).toBe(-10);
  });

  it('interpolates inside the correct segment of a multi-point range', () => {
    // Fade-in-plateau-fade-out shape: [0, 0.3, 0.7, 1] → [0, 1, 1, 0]
    const input = [0, 0.3, 0.7, 1];
    const output = [0, 1, 1, 0];
    expect(interpolateRange(0.15, input, output)).toBeCloseTo(0.5); // first segment, halfway up
    expect(interpolateRange(0.5, input, output)).toBe(1); // plateau segment
    expect(interpolateRange(0.85, input, output)).toBeCloseTo(0.5); // last segment, halfway down
  });

  it('returns exact outputs at interior breakpoints', () => {
    expect(interpolateRange(0.3, [0, 0.3, 1], [0, 7, 10])).toBe(7);
  });
});

describe('resolveMotionStyle', () => {
  it('resolves motion-value entries to their live values and keeps plain entries', () => {
    const opacity = createMotionValue(0.34);
    const resolved = resolveMotionStyle({ opacity, background: 'red' }) as Record<string, unknown>;

    expect(resolved.opacity).toBe(0.34);
    expect(resolved.background).toBe('red');

    // Live, not frozen: a later set() is visible on the next resolve.
    opacity.set(0.5);
    expect((resolveMotionStyle({ opacity }) as Record<string, unknown>).opacity).toBe(0.5);
  });

  it('passes non-object styles through untouched', () => {
    expect(resolveMotionStyle(undefined)).toBeUndefined();
    expect(resolveMotionStyle(null)).toBeNull();
    expect(resolveMotionStyle('color: red')).toBe('color: red');
  });
});
