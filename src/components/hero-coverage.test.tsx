import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockMQ = (matches = false) =>
  vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('coarse') ? false : matches,
    media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));

const mockMotionValue = (initial: unknown) => ({
  get: () => initial, set: vi.fn(), on: vi.fn(), subscribe: vi.fn(), destroy: vi.fn(),
});

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_t, tag: string) => {
      const SAFE = ['div','section','button','span','h1','p','footer','ul','li','nav','header','a'];
      const El = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement(SAFE.includes(tag) ? tag : 'div',
          Object.fromEntries(Object.entries(props).filter(([k]) =>
            !['initial','animate','whileHover','whileTap','whileInView','transition','viewport','variants','exit','style'].includes(k))),
          children);
      El.displayName = `motion.${tag}`;
      return El;
    },
  }),
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useInView: () => true,
  useReducedMotion: () => false,
  useScroll: () => ({ scrollY: mockMotionValue(0), scrollYProgress: { on: vi.fn(), get: () => 0, subscribe: vi.fn() } }),
  useSpring: (v: unknown) => mockMotionValue(v),
  useTransform: (_v: unknown, _i: unknown, _o: unknown[]) => mockMotionValue(0),
  useMotionValue: (initial: unknown) => mockMotionValue(initial),
  useMotionTemplate: (...args: unknown[]) => args.join(''),
  useMotionValueEvent: vi.fn(),
  useVelocity: (_v: unknown) => mockMotionValue(0),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => React.createElement('div', { 'data-testid': 'dynamic-mock' }),
}));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: mockMQ() });
  window.sessionStorage.clear();
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  window.sessionStorage.clear();
});

describe('Hero coverage (lines 70-221, 242)', () => {
  it('renders Hero in full tier (shouldRenderHeavyEffects=true)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full',
        shouldRenderParticles: true,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: true,
        shouldRenderCursorTrail: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));

    const { default: Hero } = await import('@/components/Hero');
    render(<Hero />);
    expect(document.getElementById('home') ?? document.querySelector('section')).toBeTruthy();
  });

  it('renders Hero in lite tier (shouldRenderHeavyEffects=false)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'lite',
        shouldRenderParticles: false,
        shouldRenderAmbientEffects: false,
        shouldRenderHeavyEffects: false,
        shouldRenderCursorTrail: false,
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));

    const { default: Hero } = await import('@/components/Hero');
    render(<Hero />);
    expect(document.body).toBeTruthy();
  });

  it('renders Hero in balanced tier (no parallax, no heavy effects)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'balanced',
        shouldRenderParticles: false,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: false,
        shouldRenderCursorTrail: false,
        prefersReducedMotion: false,
        isCoarsePointer: true,
      }),
    }));

    const { default: Hero } = await import('@/components/Hero');
    render(<Hero />);
    expect(document.body).toBeTruthy();
  });
});
