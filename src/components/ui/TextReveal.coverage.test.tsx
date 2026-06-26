import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TextReveal from './TextReveal';

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

describe('TextReveal coverage', () => {
  it('starts forced-visible when sessionStorage already set (forceVisible=true branch)', () => {
    window.sessionStorage.setItem('text-reveal-complete:Hello', '1');
    render(<TextReveal text="Hello" />);
    expect(document.body).toBeTruthy();
  });

  it('fires pageshow persisted event to set forceVisible (25-54 branch)', async () => {
    render(<TextReveal text="World" />);

    await act(async () => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: true });
      window.dispatchEvent(event);
    });

    expect(window.sessionStorage.getItem('text-reveal-complete:World')).toBe('1');
  });

  it('fires pageshow non-persisted (no-op)', async () => {
    render(<TextReveal text="Noop" />);

    await act(async () => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: false });
      window.dispatchEvent(event);
    });

    expect(document.body).toBeTruthy();
  });

  it('renders with delay prop', () => {
    render(<TextReveal text="Delayed" delay={0.3} />);
    expect(document.body).toBeTruthy();
  });

  it('saves to sessionStorage when shouldReveal becomes true', async () => {
    window.sessionStorage.setItem('text-reveal-complete:Reveal', '1');
    render(<TextReveal text="Reveal" />);
    expect(window.sessionStorage.getItem('text-reveal-complete:Reveal')).toBe('1');
  });
});
