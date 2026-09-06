import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as motion from 'framer-motion';
import * as profileHooks from '@/hooks/usePerformanceProfile';
import ProfileImage from './ProfileImage';

afterEach(() => vi.restoreAllMocks());

describe('Portrait interaction isolation', () => {
  it('tilts only over the portrait, resets on leave, and removes its listeners', () => {
    const values = vi.spyOn(motion, 'useMotionValue');
    const { container, unmount } = render(<ProfileImage src="/images/profile-hero.avif" alt="Cameron" />);
    const portrait = container.querySelector('#profile-container')!;
    const rect = vi.spyOn(portrait, 'getBoundingClientRect').mockReturnValue({
      x: 100, y: 100, left: 100, top: 100, width: 200, height: 200,
      right: 300, bottom: 300, toJSON: () => ({}),
    });
    const x = values.mock.results.at(-2)!.value;
    const y = values.mock.results.at(-1)!.value;

    fireEvent.mouseMove(window, { clientX: 240, clientY: 160 });
    expect(rect).not.toHaveBeenCalled();
    expect(x.get()).toBe(0);
    expect(y.get()).toBe(0);

    fireEvent.mouseMove(portrait, { clientX: 240, clientY: 160 });
    expect(rect).toHaveBeenCalledTimes(1);
    expect(x.get()).toBeCloseTo(0.4);
    expect(y.get()).toBeCloseTo(-0.4);
    fireEvent.mouseLeave(portrait);
    expect(x.get()).toBe(0);
    expect(y.get()).toBe(0);

    unmount();
    fireEvent.mouseMove(portrait, { clientX: 240, clientY: 160 });
    expect(rect).toHaveBeenCalledTimes(1);
  });

  it('does not rebuild the portrait animation on an unrelated parent render', () => {
    const animation = vi.spyOn(profileHooks, 'usePerformanceProfile');
    const { rerender } = render(<ProfileImage src="/images/profile-hero.avif" alt="Cameron" />);
    const initialCalls = animation.mock.calls.length;
    expect(initialCalls).toBeGreaterThan(0);
    rerender(<ProfileImage src="/images/profile-hero.avif" alt="Cameron" />);
    expect(animation).toHaveBeenCalledTimes(initialCalls);
    rerender(<ProfileImage src="/images/profile-hero.avif" alt="Cameron Aaron" />);
    expect(animation.mock.calls.length).toBeGreaterThan(initialCalls);
  });
});
