import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as engine from './hero/background-particles/engine';

import BackgroundParticles from './hero/BackgroundParticles';
import InteractiveParticles from './hero/InteractiveParticles';

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

  function createInteractiveMockCtx() {
    return {
      clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), setTransform: vi.fn(),
      fillRect: vi.fn(), drawImage: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1,
    };
  }

  it('executes interactive particles canvas animation and burst branches', () => {
    withRafQueue((callbacks) => {
      const mockCtx = createInteractiveMockCtx();
      const ctxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
      Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 });

      const { container, unmount } = render(<InteractiveParticles />);

      fireEvent.resize(window);
      fireEvent.mouseMove(window, { clientX: 400, clientY: 300 });
      fireEvent.mouseDown(window, { clientX: 400, clientY: 300 });

      // Timestamps exercise: first-frame lastTick init, the <16ms frame skip,
      // and full draw frames (advance + connections + particles + bursts).
      for (let i = 0; i < 10; i += 1) {
        act(() => {
          callbacks[i]?.(10 + i * 20);
        });
      }

      fireEvent.mouseOut(window);
      act(() => {
        callbacks[10]?.(900);
      });

      // Canvas work happened: clears, batched tier strokes, sprite draws
      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.drawImage).toHaveBeenCalled();
      // DPR capped at 2 for the 3× display
      expect(mockCtx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
      // The ambient glow layer still renders in the DOM
      expect(container.querySelectorAll('.absolute.rounded-full').length).toBeGreaterThan(0);

      unmount();
      ctxSpy.mockRestore();
      Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 });
    });
  }, 15000);

  it('interactive particles bail out when the canvas context is unavailable', () => {
    withRafQueue((callbacks) => {
      const ctxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(null as unknown as CanvasRenderingContext2D);

      const { unmount } = render(<InteractiveParticles quality="full" />);
      expect(callbacks).toHaveLength(0);

      unmount();
      ctxSpy.mockRestore();
    });
  });

  it('interactive particles tolerate a sprite canvas without a 2d context', () => {
    withRafQueue((callbacks) => {
      const mockCtx = createInteractiveMockCtx();
      const ctxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D)
        .mockReturnValueOnce(mockCtx as unknown as CanvasRenderingContext2D)
        .mockReturnValueOnce(null as unknown as CanvasRenderingContext2D);

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 640 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 480 });
      Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: undefined });

      const { unmount } = render(<InteractiveParticles quality="balanced" />);

      act(() => {
        callbacks[0]?.(10);
      });
      act(() => {
        callbacks[1]?.(40);
      });

      // devicePixelRatio undefined falls back to 1
      expect(mockCtx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
      expect(mockCtx.drawImage).toHaveBeenCalled();

      unmount();
      ctxSpy.mockRestore();
      Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 });
    });
  });

  it('interactive particles skip the animation loop when reduced motion is preferred', async () => {
    const fm = await import('framer-motion');
    const reducedSpy = vi.spyOn(fm, 'useReducedMotion').mockReturnValue(true);
    const ctxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');

    const { unmount } = render(<InteractiveParticles quality="full" />);
    expect(ctxSpy).not.toHaveBeenCalled();

    unmount();
    reducedSpy.mockRestore();
    ctxSpy.mockRestore();
  });

  it('covers draw() code paths when canvas context is available (useConnections+useMousePull true)', () => {
    withRafQueue((callbacks) => {
      const mockCtx = {
        clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
        moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), setTransform: vi.fn(),
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
        moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), setTransform: vi.fn(),
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

});
