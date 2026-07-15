import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SkillWeb from '@/components/skills/SkillWeb';

let rafQueue: FrameRequestCallback[] = [];
function flushFrames(maxFrames: number): number {
  let executed = 0;
  for (let i = 0; i < maxFrames; i += 1) {
    if (rafQueue.length === 0) break;
    const queue = rafQueue;
    rafQueue = [];
    for (const cb of queue) {
      cb(0);
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
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
};

const RECT = { left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300, x: 0, y: 0, toJSON: () => ({}) };

const CLUSTER = ['Clinical Research', 'Clinical Practice', 'Software Engineering'];

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
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(RECT as DOMRect);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SkillWeb', () => {
  it('draws edges and nodes on the full tier', () => {
    render(<SkillWeb nodes={CLUSTER} performanceTier="full" />);
    expect(screen.getByTestId('skill-web-canvas')).toBeTruthy();
    flushFrames(1);
    expect(mockCtx.stroke).toHaveBeenCalled(); // the shared-word edge
    expect(mockCtx.fill).toHaveBeenCalled(); // the nodes
    expect(mockCtx.lineTo).toHaveBeenCalled();
  });

  it('defaults to the full tier when no tier prop is given', () => {
    render(<SkillWeb nodes={CLUSTER} className="absolute inset-0" />);
    expect(screen.getByTestId('skill-web-canvas')).toBeTruthy();
    expect(rafQueue.length).toBeGreaterThan(0);
  });

  it('renders nothing on non-full tiers', () => {
    render(<SkillWeb nodes={CLUSTER} performanceTier="balanced" />);
    expect(screen.queryByTestId('skill-web-canvas')).toBeNull();
    fireEvent.mouseMove(window, { clientX: 200, clientY: 150 });
    expect(rafQueue).toHaveLength(0);
  });

  it('settles to rest and parks the loop', () => {
    render(<SkillWeb nodes={['Solo']} performanceTier="full" />);
    flushFrames(3000);
    expect(rafQueue).toHaveLength(0);
  });

  it('wakes on a pointer entering and sleeps again when it leaves', () => {
    render(<SkillWeb nodes={['Solo']} performanceTier="full" />);
    flushFrames(3000);
    expect(rafQueue).toHaveLength(0);

    fireEvent.mouseMove(window, { clientX: 200, clientY: 150 }); // inside
    expect(rafQueue.length).toBeGreaterThan(0);

    fireEvent.mouseMove(window, { clientX: 5000, clientY: 150 }); // outside
    flushFrames(3000);
    expect(rafQueue).toHaveLength(0);
  });

  it('does not double-schedule a frame on rapid moves', () => {
    render(<SkillWeb nodes={['Solo']} performanceTier="full" />);
    flushFrames(3000);
    expect(rafQueue).toHaveLength(0);
    fireEvent.mouseMove(window, { clientX: 200, clientY: 150 });
    fireEvent.mouseMove(window, { clientX: 210, clientY: 150 });
    expect(rafQueue).toHaveLength(1);
  });

  it('no-ops when the 2D context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(
      null as unknown as CanvasRenderingContext2D
    );
    render(<SkillWeb nodes={CLUSTER} performanceTier="full" />);
    expect(rafQueue).toHaveLength(0);
  });

  it('rebuilds the layout on resize', () => {
    render(<SkillWeb nodes={['Solo']} performanceTier="full" />);
    flushFrames(3000);
    expect(rafQueue).toHaveLength(0);
    fireEvent(window, new Event('resize'));
    expect(rafQueue.length).toBeGreaterThan(0);
  });

  it('cleans up listeners and frames on unmount', () => {
    const { unmount } = render(<SkillWeb nodes={CLUSTER} performanceTier="full" />);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    rafQueue = [];
    fireEvent.mouseMove(window, { clientX: 200, clientY: 150 });
    expect(rafQueue).toHaveLength(0);
  });

  it('sizes the backing store for a high-DPR screen', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    try {
      render(<SkillWeb nodes={CLUSTER} performanceTier="full" />);
      expect(mockCtx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    } finally {
      if (original) Object.defineProperty(window, 'devicePixelRatio', original);
    }
  });

  it('falls back to DPR 1 when the browser reports none', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 0 });
    try {
      render(<SkillWeb nodes={CLUSTER} performanceTier="full" />);
      expect(mockCtx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    } finally {
      if (original) Object.defineProperty(window, 'devicePixelRatio', original);
    }
  });
});
