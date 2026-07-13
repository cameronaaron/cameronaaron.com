import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import IntroCurtain from './IntroCurtain';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe('IntroCurtain coverage', () => {
  it('skips curtain when sessionStorage key already set (setVisible(false) branch lines 18-20)', () => {
    window.sessionStorage.setItem('intro-curtain-shown', '1');
    const { container } = render(<IntroCurtain />);
    // The skip must actually skip: visible=false renders nothing inside
    // AnimatePresence, so a return visitor never sees the curtain flash.
    expect(container.firstChild).toBeNull();
  });

  it('shows curtain on first visit (sessionStorage empty)', () => {
    const { container } = render(<IntroCurtain />);
    // First visit: the curtain overlay must actually mount.
    expect(container.firstChild).not.toBeNull();
  });

  it('respects holdMs prop', () => {
    const { container } = render(<IntroCurtain holdMs={200} />);
    // Custom hold duration still starts visible — the prop tunes the timer,
    // not the initial mount.
    expect(container.firstChild).not.toBeNull();
  });

  it('skips when back_forward navigation type', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'back_forward' } as PerformanceNavigationTiming,
    ]);
    const { container } = render(<IntroCurtain />);
    // bfcache-style return navigation must not replay the intro.
    expect(container.firstChild).toBeNull();
  });
});
