import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MagneticField from '@/components/ui/MagneticField';

// Controllable tier: the field only runs its physics on the full tier.
const profile = { performanceTier: 'full' as string };
vi.mock('@/hooks/usePerformanceProfile', () => ({
  usePerformanceProfile: () => profile,
}));

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
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  strokeStyle: '',
  lineWidth: 0,
};

const WRAPPER_RECT = { left: 0, top: 0, right: 600, bottom: 400, width: 600, height: 400, x: 0, y: 0, toJSON: () => ({}) };

function rectFor(el: HTMLElement): DOMRect {
  // Targets encode their centre in data-cx / data-cy; everything else (wrapper,
  // canvas) reports the full band rect.
  const cx = el.getAttribute('data-cx');
  const cy = el.getAttribute('data-cy');
  if (cx !== null && cy !== null) {
    const x = Number(cx) - 10;
    const y = Number(cy) - 10;
    return { left: x, top: y, right: x + 20, bottom: y + 20, width: 20, height: 20, x, y, toJSON: () => ({}) } as DOMRect;
  }
  return WRAPPER_RECT as DOMRect;
}

beforeEach(() => {
  profile.performanceTier = 'full';
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
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    return rectFor(this);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Targets() {
  return (
    <MagneticField targetSelector="[data-magnetic]">
      <a data-magnetic data-cx="100" data-cy="80" href="#a">
        Near
      </a>
      <a data-magnetic data-cx="500" data-cy="80" href="#b">
        Far
      </a>
    </MagneticField>
  );
}

describe('MagneticField', () => {
  it('draws a thread and ring to the nearest target when the cursor is in range', () => {
    render(<Targets />);
    fireEvent.mouseMove(window, { clientX: 108, clientY: 80 }); // near target A
    flushFrames(4);
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalled();
    expect(mockCtx.createLinearGradient).toHaveBeenCalled();
  });

  it('draws nothing but the clear when no target is within the radius', () => {
    render(<Targets />);
    fireEvent.mouseMove(window, { clientX: 300, clientY: 399 }); // >170px from both
    flushFrames(4);
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.arc).not.toHaveBeenCalled();
  });

  it('clears when the pointer leaves the wrapper bounds', () => {
    render(<Targets />);
    fireEvent.mouseMove(window, { clientX: 5000, clientY: 80 }); // outside the band
    flushFrames(4);
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.stroke).not.toHaveBeenCalled();
  });

  it('coalesces a burst of moves into a single frame', () => {
    render(<Targets />);
    flushFrames(4); // drain the mount draw
    fireEvent.mouseMove(window, { clientX: 108, clientY: 80 });
    fireEvent.mouseMove(window, { clientX: 110, clientY: 80 });
    expect(rafQueue).toHaveLength(1); // second move rides the already-scheduled frame
  });

  it('defaults to the [data-magnetic] selector when none is given', () => {
    render(
      <MagneticField>
        <a data-magnetic data-cx="100" data-cy="80" href="#a">
          Only
        </a>
      </MagneticField>
    );
    fireEvent.mouseMove(window, { clientX: 108, clientY: 80 });
    flushFrames(4);
    expect(mockCtx.arc).toHaveBeenCalled();
  });

  it('renders children without a canvas on non-full tiers', () => {
    profile.performanceTier = 'balanced';
    render(<Targets />);
    expect(screen.getByText('Near')).toBeTruthy();
    expect(screen.queryByTestId('magnetic-canvas')).toBeNull();
    fireEvent.mouseMove(window, { clientX: 108, clientY: 80 });
    expect(rafQueue).toHaveLength(0);
  });

  it('no-ops when the 2D context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(
      null as unknown as CanvasRenderingContext2D
    );
    render(<Targets />);
    expect(rafQueue).toHaveLength(0);
  });

  it('rebuilds the tree on resize', () => {
    render(<Targets />);
    flushFrames(4);
    fireEvent(window, new Event('resize'));
    expect(rafQueue.length).toBeGreaterThan(0);
  });

  it('cleans up listeners and frames on unmount', () => {
    const { unmount } = render(<Targets />);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    rafQueue = [];
    fireEvent.mouseMove(window, { clientX: 108, clientY: 80 });
    expect(rafQueue).toHaveLength(0);
  });

  it('sizes the backing store for a high-DPR screen', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    try {
      render(<Targets />);
      expect(mockCtx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    } finally {
      if (original) Object.defineProperty(window, 'devicePixelRatio', original);
    }
  });

  it('falls back to DPR 1 when the browser reports none', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 0 });
    try {
      render(<Targets />);
      expect(mockCtx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    } finally {
      if (original) Object.defineProperty(window, 'devicePixelRatio', original);
    }
  });
});
