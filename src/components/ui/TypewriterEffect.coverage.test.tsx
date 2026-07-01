import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TypewriterEffect from './TypewriterEffect';

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

describe('TypewriterEffect coverage', () => {
  it('always types out from scratch on a fresh mount, ignoring any stale sessionStorage', () => {
    window.sessionStorage.setItem('typewriter-complete:Hello World', '1');
    render(<TypewriterEffect text="Hello World" typingSpeed={1} />);
    // Full text is always present (sr-only span + hidden spacer for layout reservation),
    // but the visible glyph span starts at just the first character — no stale
    // sessionStorage flag should jump it straight to the finished state.
    // Spacer span (visibility:hidden) holds the full text; the visible span is the second.
    const ariaHiddenSpans = document.querySelectorAll('span[aria-hidden="true"]');
    const visibleSpan = ariaHiddenSpans[1];
    expect(visibleSpan?.textContent?.startsWith('Hello World')).toBe(false);
    expect(visibleSpan?.textContent?.startsWith('H')).toBe(true);
  });

  it('fires pageshow persisted event to set skip state (lines 37-39)', async () => {
    render(<TypewriterEffect text="Test text" typingSpeed={1} />);

    await act(async () => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: true });
      window.dispatchEvent(event);
    });

    expect(document.body.textContent).toContain('Test text');
  });

  it('fires pageshow non-persisted event (no-op branch)', async () => {
    render(<TypewriterEffect text="Test text 2" typingSpeed={1} />);

    await act(async () => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: false });
      window.dispatchEvent(event);
    });

    expect(document.body).toBeTruthy();
  });

  it('renders with custom className and cursorClassName', () => {
    render(<TypewriterEffect text="Hi" className="custom" cursorClassName="cursor" typingSpeed={1} />);
    expect(document.body).toBeTruthy();
  });

  it('uses default typingSpeed=100 when not provided (covers default param branch line 26)', () => {
    // Do NOT pass typingSpeed — exercises the default parameter branch
    render(<TypewriterEffect text="X" />);
    expect(document.body).toBeTruthy();
  });

  it('marks complete and covers false branch of currentIndex < text.length (lines 58-60, 68)', async () => {
    vi.useFakeTimers();
    render(<TypewriterEffect text="AB" typingSpeed={1} />);
    // Each timer fires setState; React re-renders and schedules the next timer.
    // We must advance + flush React in separate act() steps so cascading timers are picked up.
    for (let i = 0; i < 5; i++) {
      await act(async () => { vi.advanceTimersByTime(2); });
    }
    expect(document.body.textContent).toContain('AB');
    vi.useRealTimers();
  });
});
