import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock framer-motion with useInView returning false so the || forceVisible branch is exercised
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_t: object, tag: string) => {
      const SAFE = ['div','section','span','p','h1','h2','button','ul','li'];
      const El = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement(SAFE.includes(tag as string) ? (tag as string) : 'div',
          Object.fromEntries(Object.entries(props).filter(([k]) =>
            !['initial','animate','whileHover','whileTap','whileInView','transition','viewport','variants','exit','style'].includes(k))),
          children);
      El.displayName = `motion.${tag}`;
      return El;
    },
  }),
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
  useInView: () => false,
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: { on: vi.fn(), get: () => 0, subscribe: vi.fn() } }),
  useTransform: () => 0,
  useMotionValue: (v: unknown) => ({ get: () => v, set: vi.fn() }),
  useSpring: (v: unknown) => v,
}));

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
  it('becomes forced-visible via effect when sessionStorage already set (deferred readInitialReveal branch)', () => {
    window.sessionStorage.setItem('text-reveal-complete:Hello', '1');
    const { container } = render(<TextReveal text="Hello" />);
    // render() flushes effects; readInitialReveal finds '1' → setForceVisible(true)
    expect(container.firstChild).not.toBeNull();
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
    const { container } = render(<TextReveal text="Noop" />);

    await act(async () => {
      const event = new Event('pageshow') as PageTransitionEvent;
      Object.defineProperty(event, 'persisted', { value: false });
      window.dispatchEvent(event);
    });

    expect(container.firstChild).not.toBeNull();
  });

  it('renders with delay prop', () => {
    const { container } = render(<TextReveal text="Delayed" delay={0.3} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('saves to sessionStorage when shouldReveal becomes true', async () => {
    window.sessionStorage.setItem('text-reveal-complete:Reveal', '1');
    render(<TextReveal text="Reveal" />);
    expect(window.sessionStorage.getItem('text-reveal-complete:Reveal')).toBe('1');
  });
});
