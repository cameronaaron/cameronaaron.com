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

    // handleMouseLeave recenters x/y to 0.5 — the exact midpoint of the
    // [0,1]→[max,-max] transform, so both rotations must read exactly 0
    // (no residual tilt). This goes through the real interpolating mock,
    // not a frozen snapshot: a leave handler that forgot to recenter, or
    // recentered to the wrong value, fails here. (A MotionValue wrapper is
    // truthy regardless of its numeric payload — even 0 passes
    // toBeTruthy() — so the check must read .get(), never object identity.)
    expect((result.current.rotateX as { get: () => number }).get()).toBeCloseTo(0);
    expect((result.current.rotateY as { get: () => number }).get()).toBeCloseTo(0);
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

    // Pointer at (90,90) in a 100×100 rect → x=y=0.9 (calculateTiltTargets).
    // rotateX = useTransform(y, [0,1], [10,-10]) → 10 + 0.9·(−20) = −8.
    // rotateY = useTransform(x, [0,1], [−10,10]) → −10 + 0.9·(20) = 8.
    // Opposite signs on purpose: tilting toward the bottom-right corner
    // pitches the top edge away (rotateX negative) while yawing right
    // (rotateY positive) — a real 3D tilt-toward-cursor. End-to-end through
    // the event handler, the shared percentage math, AND the transform
    // layer: a sign flip or swapped axis anywhere in that chain fails here.
    expect((result.current.rotateX as { get: () => number }).get()).toBeCloseTo(-8);
    expect((result.current.rotateY as { get: () => number }).get()).toBeCloseTo(8);
  });

  it('use3DTilt clamps rotation at the range ends when the pointer overshoots the rect', () => {
    const { result } = renderHook(() => use3DTilt());

    act(() => {
      result.current.handleMouseMove({
        clientX: 200,
        clientY: -100,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 } as DOMRect),
        },
      } as never);
    });

    // (200,−100) is far outside the 100×100 rect: calculateTiltTargets
    // yields x=2, y=−1 — both beyond the [0,1] input range. Framer clamps
    // by default (and the mock mirrors that), so the card pins at its
    // maximum tilt instead of over-rotating: rotateX clamps to the y-range
    // START (10), rotateY clamps to the x-range END (10).
    expect((result.current.rotateX as { get: () => number }).get()).toBe(10);
    expect((result.current.rotateY as { get: () => number }).get()).toBe(10);
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
