import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BackToTop from './BackToTop';

function setScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  fireEvent.scroll(window);
}

describe('BackToTop', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>;
  let originalScrollTo: typeof window.scrollTo;

  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    originalScrollTo = window.scrollTo;
    scrollToSpy = vi.fn();
    Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: scrollToSpy });
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollTo', { configurable: true, writable: true, value: originalScrollTo });
  });

  it('renders without props using default threshold', () => {
    render(<BackToTop />);
    expect(screen.queryByTestId('back-to-top')).toBeNull();
  });

  it('does not render the button when scroll position is below threshold', () => {
    render(<BackToTop threshold={400} />);
    expect(screen.queryByTestId('back-to-top')).toBeNull();
  });

  it('renders the button once scroll exceeds threshold', () => {
    render(<BackToTop threshold={400} />);
    expect(screen.queryByTestId('back-to-top')).toBeNull();

    act(() => setScroll(500));
    expect(screen.getByTestId('back-to-top')).toBeTruthy();
  });

  it('hides the button again when scrolled back above threshold', () => {
    render(<BackToTop threshold={400} />);
    act(() => setScroll(800));
    expect(screen.getByTestId('back-to-top')).toBeTruthy();

    act(() => setScroll(100));
    expect(screen.queryByTestId('back-to-top')).toBeNull();
  });

  it('uses the default threshold (600) when not supplied', () => {
    render(<BackToTop />);
    act(() => setScroll(599));
    expect(screen.queryByTestId('back-to-top')).toBeNull();

    act(() => setScroll(601));
    expect(screen.getByTestId('back-to-top')).toBeTruthy();
  });

  it('scrolls to top with smooth behaviour when reduced motion is disabled', () => {
    render(<BackToTop threshold={0} />);
    act(() => setScroll(700));

    fireEvent.click(screen.getByTestId('back-to-top'));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('renders an accessible label for screen readers', () => {
    render(<BackToTop threshold={0} />);
    act(() => setScroll(700));
    const button = screen.getByLabelText('Scroll to top of page');
    expect(button.tagName).toBe('BUTTON');
  });

  it('cleans up its scroll listener on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<BackToTop threshold={0} />);
    unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    remove.mockRestore();
  });

  it('honours prefers-reduced-motion by using instant scroll', async () => {
    const fm = await import('framer-motion');
    const spy = vi.spyOn(fm, 'useReducedMotion').mockReturnValue(true);

    render(<BackToTop threshold={0} />);
    act(() => setScroll(700));

    fireEvent.click(screen.getByTestId('back-to-top'));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });

    spy.mockRestore();
  });
});
