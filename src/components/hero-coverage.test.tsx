import React from 'react';
import { fireEvent, render } from '@testing-library/react';
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

// Captures every useMotionValue() instance in call order so tests can assert
// which motion value a mousemove handler wrote into (Hero creates rawPointerX
// then rawPointerY, in that order, and nothing else calls useMotionValue).
const motionValueInstances: Array<ReturnType<typeof mockMotionValue>> = [];

vi.mock('framer-motion', () => ({
  get m() { return this.motion; },
  LazyMotion: ({ children }) => React.createElement(React.Fragment, null, children),
  domMax: {},
  domAnimation: {},
  motion: new Proxy({}, {
    get: (_t, tag: string) => {
      const SAFE = ['div','section','button','span','h1','p','footer','ul','li','nav','header','a'];
      const El = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement(SAFE.includes(tag) ? tag : 'div',
          Object.fromEntries(Object.entries(props).filter(([k]) =>
            !['initial','animate','whileHover','whileTap','whileInView','transition','viewport','variants','exit','style','drag','dragConstraints','dragElastic','dragMomentum','dragSnapToOrigin','dragTransition','whileDrag'].includes(k))),
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
  useMotionValue: (initial: unknown) => {
    const instance = mockMotionValue(initial);
    motionValueInstances.push(instance);
    return instance;
  },
  useMotionTemplate: (...args: unknown[]) => args.join(''),
  useMotionValueEvent: vi.fn(),
  useVelocity: (_v: unknown) => mockMotionValue(0),
  animate: (_from: unknown, to: number, options?: { onUpdate?: (latest: number) => void; onComplete?: () => void }) => {
    options?.onUpdate?.(to);
    options?.onComplete?.();
    return { stop: vi.fn() };
  },
}));

vi.mock('next/dynamic', () => ({
  default: () => () => React.createElement('div', { 'data-testid': 'dynamic-mock' }),
}));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: mockMQ() });
  window.sessionStorage.clear();
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });
  motionValueInstances.length = 0;
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
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));

    const { default: Hero } = await import('@/components/Hero');
    const { container } = render(<Hero />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders Hero in balanced tier (no parallax, no heavy effects)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'balanced',
        shouldRenderParticles: false,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: false,
        prefersReducedMotion: false,
        isCoarsePointer: true,
      }),
    }));

    const { default: Hero } = await import('@/components/Hero');
    const { container } = render(<Hero />);
    expect(container.firstChild).not.toBeNull();
  });

  it('does not track the pointer when heavy effects are disabled', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'balanced',
        shouldRenderParticles: false,
        shouldRenderHeavyEffects: false,
        prefersReducedMotion: false,
        isCoarsePointer: true,
      }),
    }));

    const { default: Hero } = await import('@/components/Hero');
    render(<Hero />);
    const [rawPointerX, rawPointerY] = motionValueInstances;
    fireEvent.mouseMove(window, { clientX: 123, clientY: 456 });
    expect(rawPointerX.set).not.toHaveBeenCalled();
    expect(rawPointerY.set).not.toHaveBeenCalled();
  });

  it('writes pointer coordinates into motion values on mousemove, not React state', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full',
        shouldRenderParticles: true,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));

    const { default: Hero } = await import('@/components/Hero');
    render(<Hero />);

    // Hero calls useMotionValue exactly twice, in order: rawPointerX, rawPointerY.
    const [rawPointerX, rawPointerY] = motionValueInstances;

    fireEvent.mouseMove(window, { clientX: 123, clientY: 456 });

    expect(rawPointerX.set).toHaveBeenCalledWith(123);
    expect(rawPointerY.set).toHaveBeenCalledWith(456);
  });
});

describe('hero worlds interaction', () => {
  it('switches the atmosphere and destination with mouse and keyboard', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full', shouldRenderHeavyEffects: true,
        shouldRenderParticles: true, prefersReducedMotion: false, isCoarsePointer: false,
      }),
    }));
    const { default: Hero } = await import('@/components/Hero');
    const worldListener = vi.fn();
    window.addEventListener('hero-world-change', worldListener);
    const { getByRole, container } = render(<Hero />);
    const clinical = getByRole('tab', { name: 'Clinical Care' });
    fireEvent.click(clinical);
    expect(worldListener).toHaveBeenCalledTimes(1);
    expect(clinical.getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('#home')?.getAttribute('data-world')).toBe('mint');
    expect(getByRole('link', { name: /view clinical credentials/i }).getAttribute('href')).toBe('#certifications');
    expect(container.querySelectorAll('[data-testid="dynamic-mock"]')).toHaveLength(1);

    fireEvent.keyDown(clinical, { key: 'End' });
    const nursing = getByRole('tab', { name: 'NP Path' });
    expect(document.activeElement).toBe(nursing);
    expect(nursing.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(nursing, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(getByRole('tab', { name: 'Engineering' }));
    expect(getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('hero-world-0');
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(getByRole('tab', { name: 'Engineering' }).getAttribute('aria-selected')).toBe('true');
    window.removeEventListener('hero-world-change', worldListener);
  });

  it('keeps world discovery usable without continuous motion', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'reduced', shouldRenderHeavyEffects: false,
        shouldRenderParticles: false, prefersReducedMotion: true, isCoarsePointer: true,
      }),
    }));
    const { default: Hero } = await import('@/components/Hero');
    const { getByRole, container } = render(<Hero />);
    fireEvent.click(getByRole('tab', { name: 'Security' }));
    expect(container.querySelector('#home')?.getAttribute('data-motion')).toBe('quiet');
    expect(getByRole('link', { name: /explore the research/i }).getAttribute('href')).toBe('#projects');
    expect(container.querySelectorAll('[data-testid="dynamic-mock"]')).toHaveLength(0);
  });
});
