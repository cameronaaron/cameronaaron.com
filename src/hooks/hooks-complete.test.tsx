import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useInteractionMode } from './useInteractionMode';
import { useScrollPosition } from './useScrollPosition';

describe('hooks coverage', () => {

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
