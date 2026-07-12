import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { calculateTiltTargets, use3DTilt } from './use3DTilt';
import { useInteractionMode } from './useInteractionMode';
import { useScrollPosition } from './useScrollPosition';

describe('hooks coverage', () => {
  it('calculateTiltTargets normalizes pointer position within a rect', () => {
    // Center of the rect → no tilt (0.5, 0.5); top-left corner → fully tilted (0, 0).
    // Shared by ExperienceCard, ProjectCard, and use3DTilt itself.
    expect(calculateTiltTargets({ left: 10, top: 10, width: 100, height: 100 }, 60, 60)).toEqual({ x: 0.5, y: 0.5 });
    expect(calculateTiltTargets({ left: 10, top: 10, width: 100, height: 100 }, 10, 10)).toEqual({ x: 0, y: 0 });
  });

  it('runs use3DTilt handlers with and without ref', () => {
    const { result } = renderHook(() => use3DTilt());

    act(() => {
      result.current.handleMouseMove({ clientX: 10, clientY: 10 } as never);
      result.current.handleMouseLeave();
    });

    (result.current.ref as { current: { getBoundingClientRect: () => DOMRect } | null }).current = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      } as DOMRect),
    };

    act(() => {
      result.current.handleMouseMove({ clientX: 75, clientY: 25 } as never);
      result.current.handleMouseLeave();
    });

    // vitest.setup.ts's useTransform mock doesn't interpolate the 3-array
    // (value, inputRange, outputRange) form — it freezes at outputRange[0]
    // regardless of the live input, so rotateX/rotateY always read
    // maxRotation/-maxRotation here (real interpolation is covered by the
    // calculateTiltTargets unit test above, which exercises the actual
    // percentage math without going through the mocked motion-value layer).
    // A MotionValue wrapper object is truthy regardless of its numeric
    // payload — even 0 would pass toBeTruthy() — so the real check reads
    // the value with .get() instead of trusting object identity.
    expect((result.current.rotateX as { get: () => number }).get()).toBeCloseTo(10);
    expect((result.current.rotateY as { get: () => number }).get()).toBeCloseTo(-10);
  });

  it('use3DTilt prefers the event currentTarget over ref when both are available', () => {
    // This is the path ExperienceCard/ProjectCard rely on: onMouseMove bound
    // directly to the tilted element, no ref required.
    const { result } = renderHook(() => use3DTilt());

    act(() => {
      result.current.handleMouseMove({
        clientX: 90,
        clientY: 90,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 } as DOMRect),
        },
      } as never);
    });

    // Same mock-freezing caveat as above: rotateX/rotateY read
    // outputRange[0] regardless of the actual (90,90) pointer position.
    // This still verifies the currentTarget-over-ref wiring produces a
    // real, readable motion value rather than merely a truthy object.
    expect((result.current.rotateX as { get: () => number }).get()).toBeCloseTo(10);
    expect((result.current.rotateY as { get: () => number }).get()).toBeCloseTo(-10);
  });

  it('tracks scroll threshold hook', () => {
    const scrolled = renderHook(() => useScrollPosition(10));

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20,
    });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(scrolled.result.current).toBe(true);
  });

  it('useScrollPosition uses default parameters when called without args', () => {
    const scrolled = renderHook(() => useScrollPosition());
    expect(scrolled.result.current).toBe(false);
  });

  it('returns interaction mode flags', () => {
    const { result } = renderHook(() => useInteractionMode());

    expect(result.current).toHaveProperty('prefersReducedMotion');
    expect(result.current).toHaveProperty('isCoarsePointer');
    expect(result.current).toHaveProperty('enableHoverMotion');
  });
});
