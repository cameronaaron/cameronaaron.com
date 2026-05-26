import React from 'react';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

function createMotionValue<T>(initial: T) {
  let current = initial;
  return {
    get: () => current,
    set: (next: T) => {
      current = next;
    },
    on: vi.fn(),
  };
}

function readMotionValue(value: unknown) {
  if (value && typeof value === 'object' && 'get' in value && typeof (value as { get: () => unknown }).get === 'function') {
    return (value as { get: () => unknown }).get();
  }
  return value;
}

vi.mock('framer-motion', () => {
  const stripMotionProps = (props: Record<string, unknown>) => {
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      whileInView,
      viewport,
      variants,
      layout,
      layoutId,
      drag,
      dragConstraints,
      dragElastic,
      dragMomentum,
      ...rest
    } = props;

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
      if (typeof arg2 === 'function') {
        const inputValue = Array.isArray(input) ? input.map(readMotionValue) : readMotionValue(input);
        return createMotionValue((arg2 as (value: unknown) => unknown)(inputValue));
      }

      if (Array.isArray(arg3) && arg3.length > 0) {
        return createMotionValue(arg3[0]);
      }

      return createMotionValue(readMotionValue(input));
    },
    useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, part, index) => {
        const value = index < values.length ? String(readMotionValue(values[index])) : '';
        return `${acc}${part}${value}`;
      }, ''),
  };
});

vi.mock('next/image', () => ({
  default: ({ priority, unoptimized, ...props }: Record<string, unknown>) =>
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
  Space_Grotesk: () => ({ variable: 'mock-space-grotesk' }),
}));

vi.mock('lenis', () => ({
  default: class Lenis {
    raf() {}

    destroy() {}
  },
}));

beforeAll(() => {
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
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    })),
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
