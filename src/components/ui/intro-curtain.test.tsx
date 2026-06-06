import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import IntroCurtain from './IntroCurtain';

const STORAGE_KEY = 'intro-curtain-shown';

function mockNavigationType(type: 'navigate' | 'back_forward' | 'reload') {
  const original = performance.getEntriesByType.bind(performance);
  vi.spyOn(performance, 'getEntriesByType').mockImplementation((name: string) => {
    if (name === 'navigation') {
      return [{ type } as unknown as PerformanceEntry];
    }
    return original(name);
  });
}

describe('IntroCurtain', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the curtain on the first visit of a session', () => {
    mockNavigationType('navigate');
    render(<IntroCurtain holdMs={300} />);
    expect(screen.getByTestId('intro-curtain')).toBeTruthy();
  });

  it('hides itself after the hold duration and marks the session', () => {
    mockNavigationType('navigate');
    render(<IntroCurtain holdMs={300} />);
    act(() => vi.advanceTimersByTime(350));
    expect(screen.queryByTestId('intro-curtain')).toBeNull();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe('1');
  });

  it('skips the curtain when sessionStorage already records a previous visit', () => {
    mockNavigationType('navigate');
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    render(<IntroCurtain holdMs={300} />);
    expect(screen.queryByTestId('intro-curtain')).toBeNull();
  });

  it('skips the curtain on a back/forward navigation', () => {
    mockNavigationType('back_forward');
    render(<IntroCurtain holdMs={300} />);
    expect(screen.queryByTestId('intro-curtain')).toBeNull();
  });

  it('dismisses the curtain when restored from bfcache via pageshow.persisted', () => {
    mockNavigationType('navigate');
    render(<IntroCurtain holdMs={5000} />);
    expect(screen.getByTestId('intro-curtain')).toBeTruthy();

    act(() => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: true });
      window.dispatchEvent(event);
    });
    expect(screen.queryByTestId('intro-curtain')).toBeNull();
  });

  it('ignores pageshow when not persisted', () => {
    mockNavigationType('navigate');
    render(<IntroCurtain holdMs={5000} />);
    act(() => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: false });
      window.dispatchEvent(event);
    });
    expect(screen.queryByTestId('intro-curtain')).toBeTruthy();
  });

  it('uses the default hold of 520ms when not provided', () => {
    mockNavigationType('navigate');
    render(<IntroCurtain />);
    act(() => vi.advanceTimersByTime(519));
    expect(screen.queryByTestId('intro-curtain')).toBeTruthy();
    act(() => vi.advanceTimersByTime(2));
    expect(screen.queryByTestId('intro-curtain')).toBeNull();
  });

  it('marks the curtain as decorative for assistive tech', () => {
    mockNavigationType('navigate');
    render(<IntroCurtain holdMs={300} />);
    const node = screen.getByTestId('intro-curtain');
    expect(node.getAttribute('aria-hidden')).toBe('true');
    expect(node.getAttribute('role')).toBe('presentation');
  });

  it('clears its timer on unmount', () => {
    mockNavigationType('navigate');
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(<IntroCurtain holdMs={300} />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('removes the pageshow listener on unmount', () => {
    mockNavigationType('navigate');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<IntroCurtain holdMs={300} />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
  });

  it('survives sessionStorage access errors (private mode)', () => {
    mockNavigationType('navigate');
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });

    expect(() => render(<IntroCurtain holdMs={300} />)).not.toThrow();
    expect(screen.getByTestId('intro-curtain')).toBeTruthy();
    act(() => vi.advanceTimersByTime(350));

    if (original) Object.defineProperty(window, 'sessionStorage', original);
  });

  it('still shows once with reduced motion, then dismisses quickly', async () => {
    mockNavigationType('navigate');
    const fm = await import('framer-motion');
    const spy = vi.spyOn(fm, 'useReducedMotion').mockReturnValue(true);

    render(<IntroCurtain holdMs={300} />);
    expect(screen.getByTestId('intro-curtain')).toBeTruthy();

    act(() => vi.advanceTimersByTime(230));
    expect(screen.queryByTestId('intro-curtain')).toBeNull();

    spy.mockRestore();
  });

  it('does not throw when the curtain receives a click before exiting', () => {
    mockNavigationType('navigate');
    render(<IntroCurtain holdMs={300} />);
    expect(() => fireEvent.click(screen.getByTestId('intro-curtain'))).not.toThrow();
  });
});
