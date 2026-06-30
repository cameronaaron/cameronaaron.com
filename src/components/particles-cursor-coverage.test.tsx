import { act, fireEvent, render } from '@testing-library/react';
import * as framerMotion from 'framer-motion';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as engine from './hero/background-particles/engine';

import BackgroundParticles from './hero/BackgroundParticles';
import InteractiveParticles from './hero/InteractiveParticles';
import CursorTrail from './ui/CursorTrail';

function withRafQueue(testBody: (callbacks: FrameRequestCallback[]) => void) {
  const originalRaf = window.requestAnimationFrame;
  const originalCancel = window.cancelAnimationFrame;
  const originalGlobalRaf = globalThis.requestAnimationFrame;
  const originalGlobalCancel = globalThis.cancelAnimationFrame;
  const callbacks: FrameRequestCallback[] = [];
  const queuedRaf = vi.fn((cb: FrameRequestCallback) => {
    callbacks.push(cb);
    return callbacks.length;
  });
  const queuedCancel = vi.fn();

  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: queuedRaf,
  });

  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: queuedCancel,
  });

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    writable: true,
    value: queuedRaf,
  });

  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    writable: true,
    value: queuedCancel,
  });

  try {
    testBody(callbacks);
  } finally {
    Object.defineProperty(window, 'requestAnimationFrame', { writable: true, value: originalRaf });
    Object.defineProperty(window, 'cancelAnimationFrame', { writable: true, value: originalCancel });
    Object.defineProperty(globalThis, 'requestAnimationFrame', { writable: true, value: originalGlobalRaf });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { writable: true, value: originalGlobalCancel });
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe('particle and cursor coverage', () => {
  it('handles missing canvas context branch', () => {
    const contextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValueOnce(null as unknown as CanvasRenderingContext2D);

    render(<BackgroundParticles />);
    expect(contextSpy).toHaveBeenCalledWith('2d');
  });

  it('executes background particle animation paths', () => {
    withRafQueue((callbacks) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });

      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
      const first = render(<BackgroundParticles />);

      const firstCanvas = first.container.querySelector('canvas');
      expect(firstCanvas).toBeTruthy();

      if (firstCanvas) {
        Object.defineProperty(firstCanvas, 'getBoundingClientRect', {
          configurable: true,
          value: () => ({ left: 0, top: 0, width: 500, height: 500 }),
        });
      }

      fireEvent.resize(window);
      fireEvent.mouseMove(window, { clientX: 499, clientY: 499 });
      act(() => {
        callbacks[0]?.(16);
      });
      first.unmount();

      randomSpy.mockReturnValue(1);
      const second = render(<BackgroundParticles />);
      const secondCanvas = second.container.querySelector('canvas');
      if (secondCanvas) {
        Object.defineProperty(secondCanvas, 'getBoundingClientRect', {
          configurable: true,
          value: () => ({ left: 0, top: 0, width: 500, height: 500 }),
        });
      }

      fireEvent.resize(window);
      fireEvent.mouseMove(window, { clientX: 1, clientY: 1 });
      act(() => {
        callbacks[1]?.(32);
      });

      fireEvent.mouseOut(window);
      act(() => {
        callbacks[2]?.(48);
      });

      randomSpy.mockRestore();
      second.unmount();
    });
  });

  it('executes interactive particles animation and burst branches', () => {
    withRafQueue((callbacks) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1 });

      const { container } = render(<InteractiveParticles />);

      fireEvent.mouseMove(window, { clientX: 1, clientY: 1 });
      fireEvent.mouseDown(window, { clientX: 1, clientY: 1 });

      for (let i = 0; i < 40; i += 1) {
        act(() => {
          callbacks[i]?.(10 + i * 20);
        });
      }

      fireEvent.mouseOut(window);
      act(() => {
        callbacks[40]?.(900);
      });

      expect(container.querySelectorAll('.absolute.rounded-full').length).toBeGreaterThan(0);
    });
  }, 15000);

  it('covers draw() code paths when canvas context is available (useConnections+useMousePull true)', () => {
    withRafQueue((callbacks) => {
      const mockCtx = {
        clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
        moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
        fillStyle: '', strokeStyle: '', lineWidth: 1,
      };
      const ctxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 300 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 });
      const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

      const { container, unmount } = render(<BackgroundParticles quality="full" />);
      const canvas = container.querySelector('canvas');
      if (canvas) {
        Object.defineProperty(canvas, 'getBoundingClientRect', {
          configurable: true, value: () => ({ left: 0, top: 0, width: 300, height: 300 }),
        });
      }

      fireEvent.resize(window);
      // Mouse near particles (all at 0,0 since Math.random=0) to trigger mouse-pull branch
      fireEvent.mouseMove(window, { clientX: 0, clientY: 0 });
      act(() => { callbacks[0]?.(16); });
      fireEvent.mouseOut(window);
      act(() => { callbacks[1]?.(32); });

      unmount();
      mathSpy.mockRestore();
      ctxSpy.mockRestore();
    });
  });

  it('covers draw() with useConnections=false and useMousePull=false branches', () => {
    withRafQueue((callbacks) => {
      const mockCtx = {
        clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
        moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
        fillStyle: '', strokeStyle: '', lineWidth: 1,
      };
      const ctxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
      const configSpy = vi.spyOn(engine, 'getBackgroundParticleConfig').mockReturnValue({
        denominator: 10000, maxParticles: 5, connectDistance: 0,
        mouseRadius: 0, useConnections: false, useMousePull: false,
      });

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 300 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 });

      const { unmount } = render(<BackgroundParticles quality="full" />);
      act(() => { callbacks[0]?.(16); });
      unmount();

      configSpy.mockRestore();
      ctxSpy.mockRestore();
    });
  });

  it('covers CursorTrail updatePointerMode via matchMedia change event', () => {
    let changeHandler: ((e: Partial<MediaQueryListEvent>) => void) | undefined;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_type: string, handler: (e: Partial<MediaQueryListEvent>) => void) => {
          if (_type === 'change') changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<CursorTrail />);

    act(() => {
      changeHandler?.({ matches: true } as Partial<MediaQueryListEvent>);
    });
    act(() => {
      changeHandler?.({ matches: false } as Partial<MediaQueryListEvent>);
    });
    expect(changeHandler).toBeDefined();
  });

  it('covers shouldSampleTrail false branch (same-timestamp consecutive mousemoves)', () => {
    withRafQueue((callbacks) => {
      let now = 0;
      const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now);

      const { unmount } = render(<CursorTrail />);

      // Two events at the same timestamp — second call to shouldSampleTrail returns false → return early
      fireEvent.mouseMove(window, { clientX: 80, clientY: 70 });
      fireEvent.mouseMove(window, { clientX: 82, clientY: 72 });

      // Advance time so next event samples normally
      now = 20;
      fireEvent.mouseMove(window, { clientX: 85, clientY: 74 });

      act(() => { callbacks[0]?.(16); });

      nowSpy.mockRestore();
      unmount();
    });
  });

  it('executes cursor trail visibility, hover, and ripple branches', () => {
    withRafQueue((callbacks) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      let now = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        now += 20;
        return now;
      });

      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(pointer: coarse)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const coarse = render(<CursorTrail />);
      expect(coarse.container.firstChild).toBeNull();
      coarse.unmount();

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });

      const reducedSpy = vi.spyOn(framerMotion, 'useReducedMotion');
      reducedSpy.mockReturnValue(true);
      const reduced = render(<CursorTrail />);
      expect(reduced.container.firstChild).toBeNull();
      reduced.unmount();
      reducedSpy.mockRestore();

      const { container } = render(<CursorTrail />);

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'interactive';
      document.body.appendChild(button);

      fireEvent.mouseMove(window, { clientX: 80, clientY: 70 });
      fireEvent.mouseMove(window, { clientX: 85, clientY: 74 });
      fireEvent.mouseOver(button);
      fireEvent.mouseDown(window, { clientX: 80, clientY: 70 });
      fireEvent.mouseLeave(document);
      fireEvent.mouseEnter(document);

      act(() => {
        callbacks[0]?.(16);
      });

      act(() => {
        callbacks[1]?.(36);
      });

      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
      document.body.removeChild(button);
    });
  });
});
