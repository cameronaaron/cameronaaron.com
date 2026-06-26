import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { use3DTilt } from './use3DTilt';
import { useInteractionMode } from './useInteractionMode';
import { useMousePosition } from './useMousePosition';
import { useParallax } from './useParallax';
import { useScrollPosition } from './useScrollPosition';

describe('hooks coverage', () => {
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

    expect(result.current.rotateX).toBeTruthy();
    expect(result.current.rotateY).toBeTruthy();
  });

  it('tracks pointer and scroll hooks', () => {
    const mouse = renderHook(() => useMousePosition());
    const parallax = renderHook(() => useParallax(0.75));
    const scrolled = renderHook(() => useScrollPosition(10));

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20,
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 21, clientY: 34 }));
      window.dispatchEvent(new Event('scroll'));
    });

    expect(mouse.result.current).toMatchObject({ x: 21, y: 34 });
    expect(parallax.result.current).toBe(15);
    expect(scrolled.result.current).toBe(true);
  });

  it('useParallax and useScrollPosition use default parameters when called without args', () => {
    const parallax = renderHook(() => useParallax());
    const scrolled = renderHook(() => useScrollPosition());
    expect(parallax.result.current).toBe(0);
    expect(scrolled.result.current).toBe(false);
  });

  it('returns interaction mode flags', () => {
    const { result } = renderHook(() => useInteractionMode());

    expect(result.current).toHaveProperty('prefersReducedMotion');
    expect(result.current).toHaveProperty('isCoarsePointer');
    expect(result.current).toHaveProperty('enableHoverMotion');
  });
});
