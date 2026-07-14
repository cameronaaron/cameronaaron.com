import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AuroraSurge from '@/components/ui/AuroraSurge';
import CursorComet from '@/components/ui/CursorComet';
import PointerRipple from '@/components/ui/PointerRipple';
import ScrambleText from '@/components/ui/ScrambleText';
import {
  KONAMI_SEQUENCE,
  AURORA_SURGE_EVENT,
  SURGE_DURATION_MS,
} from '@/components/ui/aurora-surge-logic';
import {
  POINTER_RIPPLE_POOL_SIZE,
  RIPPLE_DIAMETER_PX,
} from '@/components/ui/pointer-ripple-logic';

// Controllable interaction mode: the components gate hover behaviour on this.
const interactionMode = {
  prefersReducedMotion: false,
  isCoarsePointer: false,
  enableHoverMotion: true,
};
vi.mock('@/hooks/useInteractionMode', () => ({
  useInteractionMode: () => interactionMode,
}));

// Manual rAF queue so frame-driven components can be stepped deterministically.
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

beforeEach(() => {
  interactionMode.enableHoverMotion = true;
  rafQueue = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  // Unmount BEFORE unstubbing: component cleanups call cancelAnimationFrame,
  // which jsdom does not define natively — the stub must still exist.
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function typeKonami() {
  for (const key of KONAMI_SEQUENCE) {
    fireEvent.keyDown(window, { key });
  }
}

describe('AuroraSurge', () => {
  it('unlocks the overlay and broadcasts the surge event on the Konami code', () => {
    const surgeListener = vi.fn();
    window.addEventListener(AURORA_SURGE_EVENT, surgeListener);
    render(<AuroraSurge />);

    expect(screen.queryByTestId('aurora-surge-overlay')).toBeNull();
    typeKonami();

    expect(screen.getByTestId('aurora-surge-overlay')).toBeTruthy();
    expect(surgeListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(AURORA_SURGE_EVENT, surgeListener);
  });

  it('dismisses itself after SURGE_DURATION_MS', () => {
    vi.useFakeTimers();
    render(<AuroraSurge />);

    typeKonami();
    expect(screen.getByTestId('aurora-surge-overlay')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(SURGE_DURATION_MS + 50);
    });
    expect(screen.queryByTestId('aurora-surge-overlay')).toBeNull();
  });

  it('ignores keystrokes typed into editable targets', () => {
    render(
      <>
        <input aria-label="decoy" />
        <AuroraSurge />
      </>
    );

    const input = screen.getByLabelText('decoy');
    for (const key of KONAMI_SEQUENCE) {
      fireEvent.keyDown(input, { key });
    }
    expect(screen.queryByTestId('aurora-surge-overlay')).toBeNull();
  });

  it('recovers from a broken attempt and still completes', () => {
    render(<AuroraSurge />);

    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'x' }); // reset
    typeKonami();
    expect(screen.getByTestId('aurora-surge-overlay')).toBeTruthy();
  });

  it('removes its keydown listener and timer on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(<AuroraSurge />);
    typeKonami();
    unmount();
    // Timer was cleared — advancing time after unmount must not throw or warn.
    vi.advanceTimersByTime(SURGE_DURATION_MS + 50);
    fireEvent.keyDown(window, { key: 'ArrowUp' });
  });
});

describe('PointerRipple', () => {
  it('renders a fixed pool of ripple nodes sized from the logic constant', () => {
    const { container } = render(<PointerRipple />);

    const nodes = container.querySelectorAll('.pointer-ripple');
    expect(nodes).toHaveLength(POINTER_RIPPLE_POOL_SIZE);
    for (const node of nodes) {
      expect((node as HTMLElement).style.width).toBe(`${RIPPLE_DIAMETER_PX}px`);
    }
  });

  it('centres a ripple on the tap point and cycles the pool round-robin', () => {
    const { container } = render(<PointerRipple />);
    const nodes = container.querySelectorAll<HTMLElement>('.pointer-ripple');

    fireEvent.pointerDown(window, { clientX: 300, clientY: 200 });
    expect(nodes[0].style.left).toBe(`${300 - RIPPLE_DIAMETER_PX / 2}px`);
    expect(nodes[0].style.top).toBe(`${200 - RIPPLE_DIAMETER_PX / 2}px`);
    expect(nodes[0].className).toContain('pointer-ripple-run');

    fireEvent.pointerDown(window, { clientX: 40, clientY: 60 });
    expect(nodes[1].style.left).toBe(`${40 - RIPPLE_DIAMETER_PX / 2}px`);
    expect(nodes[1].className).toContain('pointer-ripple-run');

    // Wrap-around: pool of N reuses node 0 on tap N+1.
    for (let i = 0; i < POINTER_RIPPLE_POOL_SIZE - 1; i += 1) {
      fireEvent.pointerDown(window, { clientX: 10, clientY: 10 });
    }
    expect(nodes[0].style.left).toBe(`${10 - RIPPLE_DIAMETER_PX / 2}px`);
  });

  it('stops reacting to taps after unmount', () => {
    const { container, unmount } = render(<PointerRipple />);
    const firstNode = container.querySelector<HTMLElement>('.pointer-ripple');
    unmount();
    fireEvent.pointerDown(window, { clientX: 500, clientY: 500 });
    expect(firstNode?.className).not.toContain('pointer-ripple-run');
  });

  it('is decorative: hidden from assistive tech and never intercepts input', () => {
    const { container } = render(<PointerRipple />);
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.className).toContain('pointer-events-none');
  });
});

describe('ScrambleText', () => {
  it('scrambles on hover and decodes back to the exact original text', () => {
    render(<ScrambleText text="Cameron" />);
    const node = screen.getByText('Cameron');

    fireEvent.mouseEnter(node);
    const ranFrames = flushFrames(200);

    expect(ranFrames).toBeGreaterThan(0);
    expect(node.textContent).toBe('Cameron');
    // Completed runs must not leave a frame scheduled.
    expect(rafQueue).toHaveLength(0);
  });

  it('shows glyph churn mid-animation before resolving', () => {
    render(<ScrambleText text="Cameron" />);
    const node = screen.getByText('Cameron');

    fireEvent.mouseEnter(node);
    flushFrames(2);
    // Two frames in, the reveal point is < 1 character — tail is still glyphs.
    expect(node.textContent).toHaveLength('Cameron'.length);
    expect(node.textContent).not.toBe('Cameron');

    flushFrames(200);
    expect(node.textContent).toBe('Cameron');
  });

  it('does nothing on hover for coarse/reduced-motion pointers', () => {
    interactionMode.enableHoverMotion = false;
    render(<ScrambleText text="Cameron" />);
    const node = screen.getByText('Cameron');

    fireEvent.mouseEnter(node);
    expect(rafQueue).toHaveLength(0);
    expect(node.textContent).toBe('Cameron');
  });

  it('restores the original text and cancels frames on unmount mid-scramble', () => {
    const { unmount } = render(<ScrambleText text="Cameron" />);
    const node = screen.getByText('Cameron');

    fireEvent.mouseEnter(node);
    flushFrames(1);
    unmount();

    expect(node.textContent).toBe('Cameron');
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('keeps an accessible label equal to the real text', () => {
    render(<ScrambleText text="Cameron" />);
    expect(screen.getByText('Cameron').getAttribute('aria-label')).toBe('Cameron');
  });
});

describe('CursorComet', () => {
  const mockCtx = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    globalAlpha: 1,
    fillStyle: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D
    );
  });

  it('sheds sparks on pointer movement, then sleeps once the trail burns out', () => {
    render(<CursorComet />);
    // Idle mount schedules nothing — the loop only wakes on movement.
    expect(rafQueue).toHaveLength(0);

    fireEvent.mouseMove(window, { clientX: 400, clientY: 300 });
    expect(rafQueue.length).toBeGreaterThan(0);

    // Run the loop to exhaustion: sparks decay and the loop must go back to sleep.
    flushFrames(400);
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(rafQueue).toHaveLength(0);
  });

  it('answers the aurora surge event with a spark storm', () => {
    render(<CursorComet />);

    fireEvent(window, new CustomEvent(AURORA_SURGE_EVENT));
    expect(rafQueue.length).toBeGreaterThan(0);

    flushFrames(400);
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(rafQueue).toHaveLength(0);
  });

  it('cleans up listeners and frames on unmount', () => {
    const { unmount } = render(<CursorComet />);
    fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalled();
    rafQueue = [];
    fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
    fireEvent(window, new CustomEvent(AURORA_SURGE_EVENT));
    expect(rafQueue).toHaveLength(0);
  });

  it('is decorative: hidden from assistive tech and never intercepts input', () => {
    const { container } = render(<CursorComet />);
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.className).toContain('pointer-events-none');
  });
});
