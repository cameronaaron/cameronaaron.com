import React from 'react';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
// The mock's pure helpers live in a first-class, unit-tested module —
// src/test-utils/motion-mock.test.ts pins the interpolation math, and
// src/test-quality-contract.test.ts verifies the assembled mock end-to-end.
import {
  createComputedMotionValue,
  createMotionValue,
  interpolateRange,
  readMotionValue,
  resolveMotionStyle,
} from './src/test-utils/motion-mock';

vi.mock('framer-motion', () => {
  const stripMotionProps = (props: Record<string, unknown>) => {
    const {
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      whileInView: _whileInView,
      viewport: _viewport,
      variants: _variants,
      layout: _layout,
      layoutId: _layoutId,
      drag: _drag,
      dragConstraints: _dragConstraints,
      dragElastic: _dragElastic,
      dragMomentum: _dragMomentum,
      dragSnapToOrigin: _dragSnapToOrigin,
      dragTransition: _dragTransition,
      whileDrag: _whileDrag,
      ...rest
    } = props;

    // Resolve motion-value objects inside `style` to their live values, the
    // way real framer-motion writes computed numbers to the DOM. This keeps
    // derived-value callbacks (useTransform fn form) executing at render and
    // lets tests assert rendered styles numerically instead of seeing
    // "[object Object]".
    rest.style = resolveMotionStyle(rest.style);

    return rest;
  };

  const motion = new Proxy(
    {},
    {
      get: (_target, key) => {
        const tag = typeof key === 'string' ? key : 'div';
        return React.forwardRef<HTMLElement, Record<string, unknown>>(function MotionTag(props, ref) {
          const clean = stripMotionProps(props);
          return React.createElement(tag, { ...clean, ref }, clean.children);
        });
      },
    }
  );

  return {
    motion,
    // Deterministic imperative animate(): jump straight to the final frame so
    // tests observe the settled DOM (count-ups land on their target).
    animate: (
      _from: number,
      to: number,
      options?: { onUpdate?: (latest: number) => void; onComplete?: () => void }
    ) => {
      options?.onUpdate?.(to);
      options?.onComplete?.();
      return { stop: () => undefined };
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useMotionValue: (value = 0) => createMotionValue(value),
    useSpring: <T,>(value: T) => value,
    useVelocity: () => createMotionValue(0),
    useReducedMotion: () => false,
    useInView: () => true,
    useScroll: () => ({
      scrollY: createMotionValue(0),
      scrollYProgress: createMotionValue(0),
    }),
    useMotionValueEvent: (
      _value: unknown,
      _event: string,
      _callback: (next: number) => void
    ) => undefined,
    useTransform: (
      input: unknown,
      arg2?: unknown,
      arg3?: unknown
    ) => {
      // All three forms are LAZY — they re-read the live input(s) on every
      // .get() instead of snapshotting at creation. Tests can therefore
      // drive a source motion value (pointer position, scroll) and assert
      // the real transformed output end-to-end.
      if (typeof arg2 === 'function') {
        const transform = arg2 as (value: unknown) => unknown;
        return createComputedMotionValue(() =>
          transform(Array.isArray(input) ? input.map(readMotionValue) : readMotionValue(input))
        );
      }

      if (Array.isArray(arg2) && Array.isArray(arg3) && arg3.length > 0) {
        const inputRange = arg2 as number[];
        const outputRange = arg3 as unknown[];
        // Every production call site maps onto numeric outputs today; if a
        // future call maps onto strings (colors, percents), fall back to the
        // start value rather than producing NaN arithmetic.
        if (!outputRange.every((entry) => typeof entry === 'number')) {
          return createComputedMotionValue(() => outputRange[0]);
        }
        return createComputedMotionValue(() =>
          interpolateRange(Number(readMotionValue(input)), inputRange, outputRange as number[])
        );
      }

      return createComputedMotionValue(() => readMotionValue(input));
    },
    useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, part, index) => {
        const value = index < values.length ? String(readMotionValue(values[index])) : '';
        return `${acc}${part}${value}`;
      }, ''),
  };
});

vi.mock('next/image', () => ({
  default: ({ priority: _priority, unoptimized: _unoptimized, ...props }: Record<string, unknown>) =>
    React.createElement('img', props),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...rest }, children),
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicComponent = (props: Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'dynamic-component' }, props.children);

    return DynamicComponent;
  },
}));

vi.mock('next/font/google', () => ({
  Manrope: () => ({ className: 'mock-manrope' }),
  Bricolage_Grotesque: () => ({ variable: 'mock-bricolage-grotesque' }),
  Geist_Mono: () => ({ variable: 'mock-geist-mono' }),
}));

vi.mock('lenis', () => ({
  default: class Lenis {
    raf() {}

    destroy() {}
  },
}));

beforeAll(() => {
  if (typeof window === 'undefined') return;

  const listeners = new Map<string, Set<(event: Event) => void>>();

  const matchMedia = vi.fn().mockImplementation((query: string) => {
    const mediaListeners = listeners.get(query) ?? new Set<(event: Event) => void>();
    listeners.set(query, mediaListeners);

    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: (handler: (event: Event) => void) => mediaListeners.add(handler),
      removeListener: (handler: (event: Event) => void) => mediaListeners.delete(handler),
      addEventListener: (_type: string, handler: (event: Event) => void) => mediaListeners.add(handler),
      removeEventListener: (_type: string, handler: (event: Event) => void) => mediaListeners.delete(handler),
      dispatchEvent: (event: Event) => {
        mediaListeners.forEach((handler) => handler(event));
        return true;
      },
    };
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMedia,
  });

  const requestAnimationFrameMock = vi.fn(() => 1);
  const cancelAnimationFrameMock = vi.fn();

  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: requestAnimationFrameMock,
  });

  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: cancelAnimationFrameMock,
  });

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    writable: true,
    value: requestAnimationFrameMock,
  });

  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    writable: true,
    value: cancelAnimationFrameMock,
  });

  class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserver,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: vi.fn(() => ({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      setTransform: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
    })),
  });

  // jsdom in this vitest setup doesn't implement Storage — Node's own global
  // `localStorage` (opt-in, file-backed) shadows it instead and throws/warns
  // without --localstorage-file. Polyfill a plain in-memory Storage so any
  // component/hook can read and write localStorage in tests.
  class MemoryStorage {
    private store = new Map<string, string>();

    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }

    setItem(key: string, value: string): void {
      this.store.set(key, String(value));
    }

    removeItem(key: string): void {
      this.store.delete(key);
    }

    clear(): void {
      this.store.clear();
    }

    key(index: number): string | null {
      return Array.from(this.store.keys())[index] ?? null;
    }

    get length(): number {
      return this.store.size;
    }
  }

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: new MemoryStorage(),
  });

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {},
      register: vi.fn().mockResolvedValue({
        scope: '/',
        installing: {
          state: 'installed',
          addEventListener: vi.fn((event: string, callback: () => void) => {
            if (event === 'statechange') callback();
          }),
          postMessage: vi.fn(),
        },
        addEventListener: vi.fn(),
      }),
      addEventListener: vi.fn(),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
