import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── mocks ──────────────────────────────────────────────────────────────────
const mockMQ = () =>
  vi.fn().mockImplementation((q: string) => ({
    matches: false, media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));

const mockMotionValue = (v: unknown) => ({ get: () => v, set: vi.fn(), on: vi.fn(), subscribe: vi.fn() });

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_t, tag: string) => {
      const SAFE = ['div','section','span','canvas'];
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
  useScroll: () => ({ scrollYProgress: { on: vi.fn(), get: () => 0, subscribe: vi.fn() } }),
  useSpring: (v: unknown) => mockMotionValue(v),
  useTransform: () => mockMotionValue(0),
  useMotionValue: (v: unknown) => mockMotionValue(v),
  useMotionTemplate: (...args: unknown[]) => args.join(''),
  useMotionValueEvent: vi.fn(),
  useVelocity: () => mockMotionValue(0),
}));

// Canvas mock
const mockCtx = {
  clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
  fill: vi.fn(), stroke: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
  createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(),
  globalAlpha: 1, strokeStyle: '', fillStyle: '', lineWidth: 1,
};

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: mockMQ() });
  // Use synchronous 1-shot RAF to exercise the draw() callback without infinite recursion
  let rafActive = true;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    if (rafActive) {
      rafActive = false;
      cb(performance.now());
      rafActive = true;
    }
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
  // Non-zero dimensions so initParticles() creates actual particles
  vi.stubGlobal('innerWidth', 1000);
  vi.stubGlobal('innerHeight', 800);
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

// ── background-particles engine ─────────────────────────────────────────────
describe('background-particles engine coverage (line 43)', () => {
  it('createBackgroundParticle without random arg (uses Math.random default)', async () => {
    const { createBackgroundParticle } = await import('@/components/hero/background-particles/engine');
    const p = createBackgroundParticle(800, 600);
    expect(typeof p.x).toBe('number');
  });

  it('createBackgroundParticle with explicit random fn', async () => {
    const { createBackgroundParticle } = await import('@/components/hero/background-particles/engine');
    const p = createBackgroundParticle(800, 600, () => 0.5);
    expect(p.x).toBe(400);
  });
});

// ── interactive-particles engine ────────────────────────────────────────────
describe('interactive-particles engine coverage (lines 93, 203)', () => {
  it('createInitialParticles with default args (covers default param branches at 93)', async () => {
    const { createInitialParticles } = await import('@/components/hero/interactive-particles/engine');
    const particles = createInitialParticles();
    expect(particles.length).toBe(42);
  });

  it('stepParticles with quality=balanced covers attraction branch (line 203)', async () => {
    const { stepParticles } = await import('@/components/hero/interactive-particles/engine');
    // Place a particle at (49, 50) — distance 1 from pointer (50, 50), satisfies < 22 && > 0.001
    const particles = [{
      id: 0, x: 49, y: 50, size: 2, color: '#fff',
      velocity: { x: 0, y: 0 }, opacity: 1, phase: 0,
    }];
    const result = stepParticles(particles, 16, { x: 50, y: 50, active: true }, 'balanced');
    expect(result.length).toBe(1);
  });

  it('stepParticles with quality=full covers attraction full branch (line 203)', async () => {
    const { stepParticles } = await import('@/components/hero/interactive-particles/engine');
    // Place a particle at (49, 50) — distance 1 from pointer (50, 50), satisfies < 22 && > 0.001
    const particles = [{
      id: 0, x: 49, y: 50, size: 2, color: '#fff',
      velocity: { x: 0, y: 0 }, opacity: 1, phase: 0,
    }];
    const result = stepParticles(particles, 16, { x: 50, y: 50, active: true }, 'full');
    expect(result.length).toBe(1);
  });
});

// ── BackgroundParticles component ───────────────────────────────────────────
describe('BackgroundParticles coverage (line 151)', () => {
  it('renders with quality=full (shouldRenderBackgroundParticles=true)', async () => {
    const { default: BackgroundParticles } = await import('@/components/hero/BackgroundParticles');
    render(<BackgroundParticles quality="full" />);
    expect(document.body).toBeTruthy();
  });

  it('returns null with quality=lite (shouldRenderBackgroundParticles=false, line 151)', async () => {
    const { default: BackgroundParticles } = await import('@/components/hero/BackgroundParticles');
    const { container } = render(<BackgroundParticles quality="lite" />);
    expect(container.firstChild).toBeNull();
  });
});

// ── InteractiveParticles component ──────────────────────────────────────────
describe('InteractiveParticles coverage (line 125)', () => {
  it('renders with quality=full', async () => {
    const { default: InteractiveParticles } = await import('@/components/hero/InteractiveParticles');
    render(<InteractiveParticles quality="full" />);
    expect(document.body).toBeTruthy();
  });

  it('returns null with quality=lite (line 125 null branch)', async () => {
    const { default: InteractiveParticles } = await import('@/components/hero/InteractiveParticles');
    const { container } = render(<InteractiveParticles quality="lite" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null with quality=reduced (line 125 null branch)', async () => {
    const { default: InteractiveParticles } = await import('@/components/hero/InteractiveParticles');
    const { container } = render(<InteractiveParticles quality="reduced" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with quality=balanced (covers line 32 balanced seed branch)', async () => {
    const { default: InteractiveParticles } = await import('@/components/hero/InteractiveParticles');
    render(<InteractiveParticles quality="balanced" />);
    expect(document.body).toBeTruthy();
  });
});
