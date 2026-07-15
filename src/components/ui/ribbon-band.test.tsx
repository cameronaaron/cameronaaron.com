import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RibbonBand from '@/components/ui/RibbonBand';

// Manual rAF queue so the physics loop can be stepped deterministically.
let rafQueue: FrameRequestCallback[] = [];

function flushFrames(maxFrames: number, stepMs = 20): number {
  let time = 0;
  let executed = 0;
  for (let i = 0; i < maxFrames; i += 1) {
    if (rafQueue.length === 0) break;
    const queue = rafQueue;
    rafQueue = [];
    time += stepMs;
    for (const callback of queue) {
      callback(time);
      executed += 1;
    }
  }
  return executed;
}

const mockCtx = {
  clearRect: vi.fn(),
  setTransform: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  stroke: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  lineCap: '',
};

const BAND_RECT = { left: 0, top: 0, right: 800, bottom: 160, width: 800, height: 160, x: 0, y: 0, toJSON: () => ({}) };

beforeEach(() => {
  rafQueue = [];
  vi.clearAllMocks();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    BAND_RECT as DOMRect
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('RibbonBand', () => {
  it('renders an interactive canvas on the full tier and draws a frame', () => {
    render(<RibbonBand performanceTier="full" />);
    expect(screen.getByTestId('ribbon-canvas')).toBeTruthy();
    // resize() runs on mount, seeds the ribbons, and wakes the loop.
    expect(rafQueue.length).toBeGreaterThan(0);
    flushFrames(1);
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('defaults to the interactive full tier when no tier prop is given', () => {
    render(<RibbonBand />);
    expect(screen.getByTestId('ribbon-canvas')).toBeTruthy();
    expect(rafQueue.length).toBeGreaterThan(0);
  });

  it('does not double-schedule a frame when the pointer moves twice mid-run', () => {
    render(<RibbonBand performanceTier="full" />);
    flushFrames(600); // settle to rest → loop parked
    expect(rafQueue).toHaveLength(0);

    fireEvent.mouseMove(window, { clientX: 400, clientY: 80 }); // wakes, frameId set
    fireEvent.mouseMove(window, { clientX: 420, clientY: 80 }); // wake() sees a live frame → no-op
    expect(rafQueue).toHaveLength(1);
  });

  it('wakes on a pointer entering the band and settles back to sleep when it leaves', () => {
    render(<RibbonBand performanceTier="full" />);
    flushFrames(600); // let the mount-time motion settle to rest → loop parks
    expect(rafQueue).toHaveLength(0);

    fireEvent.mouseMove(window, { clientX: 400, clientY: 80 }); // inside the band
    expect(rafQueue.length).toBeGreaterThan(0);

    fireEvent.mouseMove(window, { clientX: 5000, clientY: 80 }); // leaves the band
    flushFrames(600);
    expect(rafQueue).toHaveLength(0);
  });

  it('sizes the backing store for a high-DPR screen', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    try {
      render(<RibbonBand performanceTier="full" />);
      expect(mockCtx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    } finally {
      if (original) Object.defineProperty(window, 'devicePixelRatio', original);
    }
  });

  it('falls back to DPR 1 when the browser reports none', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 0 });
    try {
      render(<RibbonBand performanceTier="full" />);
      expect(mockCtx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    } finally {
      if (original) Object.defineProperty(window, 'devicePixelRatio', original);
    }
  });

  it('renders a static hairline (no canvas, no frames) on non-full tiers', () => {
    render(<RibbonBand performanceTier="balanced" />);
    expect(screen.queryByTestId('ribbon-canvas')).toBeNull();
    expect(screen.getByTestId('ribbon-static')).toBeTruthy();
    fireEvent.mouseMove(window, { clientX: 400, clientY: 80 });
    expect(rafQueue).toHaveLength(0);
  });

  it('no-ops when the 2D context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(
      null as unknown as CanvasRenderingContext2D
    );
    render(<RibbonBand performanceTier="full" />);
    expect(rafQueue).toHaveLength(0);
  });

  it('cleans up listeners and frames on unmount', () => {
    const { unmount } = render(<RibbonBand performanceTier="full" />);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    rafQueue = [];
    fireEvent.mouseMove(window, { clientX: 400, clientY: 80 });
    expect(rafQueue).toHaveLength(0);
  });

  it('rebuilds the ribbons on window resize', () => {
    render(<RibbonBand performanceTier="full" />);
    flushFrames(600);
    expect(rafQueue).toHaveLength(0);
    fireEvent(window, new Event('resize'));
    // resize() re-seeds and wakes the loop again.
    expect(rafQueue.length).toBeGreaterThan(0);
  });
});
