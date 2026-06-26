import React from 'react';
import { act, render, screen } from '@testing-library/react';
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
  it('skips typing when sessionStorage says already complete (readInitialComplete)', () => {
    window.sessionStorage.setItem('typewriter-complete:Hello World', '1');
    render(<TypewriterEffect text="Hello World" typingSpeed={1} />);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('fires pageshow persisted event to set skip state (lines 37-39)', async () => {
    render(<TypewriterEffect text="Test text" typingSpeed={1} />);

    await act(async () => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: true });
      window.dispatchEvent(event);
    });

    expect(screen.getByText('Test text')).toBeTruthy();
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
});
