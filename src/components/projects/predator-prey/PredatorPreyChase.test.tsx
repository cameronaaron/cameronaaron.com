import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInView } from 'framer-motion';

import PredatorPreyChase from './PredatorPreyChase';
import {
  CATCH_RADIUS,
  INITIAL_SIM_SEED,
  PAUSED_CAPTION,
  SIMULATION_ARIA_LABEL,
  createInitialEntities,
  formatSurvivalSeconds,
} from './predator-prey-logic';

/**
 * The repo-wide vitest.setup.ts stubs requestAnimationFrame as a no-op (`() =>
 * 1`, never invoking the callback) so components never spin an animation
 * loop during unrelated tests. Here we need frames to actually advance the
 * simulation, so — matching the established pattern in
 * particles-and-engines-coverage.test.tsx — each test locally overrides it
 * with a synchronous one-shot runner: calling the captured callback directly
 * advances exactly one frame without recursing into an infinite loop (the
 * `active` guard defers the callback's own re-scheduling until it returns).
 */
function stubOneShotRaf() {
  let capturedCallback: FrameRequestCallback | null = null;
  let active = true;

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    capturedCallback = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  return {
    /** Run exactly one queued frame at the given timestamp (ms). */
    runFrame(timeMs: number) {
      if (!active) return;
      const cb = capturedCallback;
      capturedCallback = null;
      active = false;
      cb?.(timeMs);
      active = true;
    },
  };
}

describe('PredatorPreyChase — initial render (hydration safety)', () => {
  it('renders the arena, predator, and prey at the deterministic seeded layout', () => {
    render(<PredatorPreyChase />);

    const { predator, prey } = createInitialEntities(INITIAL_SIM_SEED);
    const predatorEl = screen.getByTestId('pp-predator');
    const preyEl = screen.getByTestId('pp-prey');

    expect(predatorEl.getAttribute('cx')).toBe(String(predator.x));
    expect(predatorEl.getAttribute('cy')).toBe(String(predator.y));
    expect(preyEl.getAttribute('cx')).toBe(String(prey.x));
    expect(preyEl.getAttribute('cy')).toBe(String(prey.y));
  });

  it('renders two independent mounts identically for the fixed initial seed', () => {
    const first = render(<PredatorPreyChase />);
    const firstPredator = screen.getByTestId('pp-predator').getAttribute('cx');
    const firstPrey = screen.getByTestId('pp-prey').getAttribute('cx');
    first.unmount();

    render(<PredatorPreyChase />);
    expect(screen.getByTestId('pp-predator').getAttribute('cx')).toBe(firstPredator);
    expect(screen.getByTestId('pp-prey').getAttribute('cx')).toBe(firstPrey);
  });

  it('starts with zero catches, a zeroed timer, and no announcement', () => {
    render(<PredatorPreyChase />);

    expect(screen.getByTestId('pp-catches').textContent).toBe('0');
    expect(screen.getByTestId('pp-timer').textContent).toBe(formatSurvivalSeconds(0));
    expect(screen.getByTestId('pp-best').textContent).toBe(`${formatSurvivalSeconds(0)}s`);
    expect(screen.getByTestId('pp-announcement').textContent).toBe('');
  });
});

describe('PredatorPreyChase — accessibility basics', () => {
  it('describes the simulation via an aria-label on the arena', () => {
    render(<PredatorPreyChase />);
    expect(screen.getByLabelText(SIMULATION_ARIA_LABEL)).not.toBeNull();
  });

  it('surfaces catch announcements through a polite status live region', () => {
    render(<PredatorPreyChase />);
    const region = screen.getByTestId('pp-announcement');
    expect(region.getAttribute('role')).toBe('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
  });
});

describe('PredatorPreyChase — animation-tier gating', () => {
  afterEach(() => {
    vi.doUnmock('@/hooks/usePerformanceProfile');
    vi.resetModules();
  });

  it('renders the live arena (not the paused caption) on the default full tier', () => {
    render(<PredatorPreyChase />);
    expect(screen.getByTestId('pp-arena')).not.toBeNull();
    expect(screen.queryByTestId('pp-paused')).toBeNull();
  });

  it('renders a static paused frame instead of the arena on the lite tier', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({ performanceTier: 'lite' }),
    }));
    const { default: PausedPredatorPreyChase } = await import('./PredatorPreyChase');

    render(<PausedPredatorPreyChase />);
    expect(screen.queryByTestId('pp-arena')).toBeNull();
    expect(screen.getByTestId('pp-paused').textContent).toBe(PAUSED_CAPTION);
  });

  it('renders a static paused frame instead of the arena on the reduced tier', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({ performanceTier: 'reduced' }),
    }));
    const { default: PausedPredatorPreyChase } = await import('./PredatorPreyChase');

    render(<PausedPredatorPreyChase />);
    expect(screen.queryByTestId('pp-paused')).not.toBeNull();
  });
});

describe('PredatorPreyChase — per-frame stepping and cleanup', () => {
  let raf: ReturnType<typeof stubOneShotRaf>;

  beforeEach(() => {
    raf = stubOneShotRaf();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('advances the on-screen timer text after a frame elapses', () => {
    render(<PredatorPreyChase />);

    expect(screen.getByTestId('pp-timer').textContent).toBe('0.0');

    act(() => raf.runFrame(0)); // first frame: lastTime seeds from this timestamp, dt=0
    act(() => raf.runFrame(500)); // 500ms elapsed since the first frame's lastTime baseline

    const timerText = screen.getByTestId('pp-timer').textContent;
    expect(timerText).not.toBe('0.0');
  });

  it('cancels the animation frame on unmount (lifecycle hygiene)', () => {
    const cancelSpy = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);

    const { unmount } = render(<PredatorPreyChase />);
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('moves the prey toward a pointer target dispatched via onPointerMove', () => {
    render(<PredatorPreyChase />);
    const arena = screen.getByTestId('pp-arena');

    const rectMock = { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) };
    vi.spyOn(arena, 'getBoundingClientRect').mockReturnValue(rectMock as DOMRect);

    const preyBeforeX = screen.getByTestId('pp-prey').getAttribute('cx');

    arena.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 5, clientY: 5, bubbles: true, cancelable: true }),
    );
    act(() => raf.runFrame(0));
    act(() => raf.runFrame(16));

    const preyAfterX = screen.getByTestId('pp-prey').getAttribute('cx');
    expect(preyAfterX).not.toBe(preyBeforeX);
  });

  it('moves the prey via arrow keys alone — no pointer required (WCAG 2.1.1)', () => {
    render(<PredatorPreyChase />);
    const arena = screen.getByTestId('pp-arena');

    const preyBeforeX = screen.getByTestId('pp-prey').getAttribute('cx');

    fireEvent.keyDown(arena, { key: 'ArrowRight' });
    act(() => raf.runFrame(0));
    act(() => raf.runFrame(16));

    const preyAfterX = screen.getByTestId('pp-prey').getAttribute('cx');
    expect(preyAfterX).not.toBe(preyBeforeX);
  });

  it('is focusable and keyboard-operable (tabIndex + application role, not just role=img)', () => {
    render(<PredatorPreyChase />);
    const arena = screen.getByTestId('pp-arena');

    expect(arena.getAttribute('tabindex')).toBe('0');
    expect(arena.getAttribute('role')).toBe('application');
  });

  it('ignores an unrecognized key without moving the prey', () => {
    render(<PredatorPreyChase />);
    const arena = screen.getByTestId('pp-arena');

    const preyBeforeX = screen.getByTestId('pp-prey').getAttribute('cx');
    fireEvent.keyDown(arena, { key: 'Tab' });
    act(() => raf.runFrame(0));

    expect(screen.getByTestId('pp-prey').getAttribute('cx')).toBe(preyBeforeX);
  });

  it('reports a catch through the announcement region once predator and prey collide', () => {
    render(<PredatorPreyChase />);

    // Drive enough frames with the prey pinned at the arena center (its pointer
    // target defaults there) that the autonomously-pursuing predator catches up.
    // Wrapped in act() so React flushes the setAnnouncement/setCatches state updates
    // the catch-detection branch triggers before this loop reads the DOM.
    act(() => raf.runFrame(0));
    for (let frame = 1; frame <= 400; frame += 1) {
      act(() => raf.runFrame(frame * FRAME_STEP_MS));
      const announcement = screen.getByTestId('pp-announcement').textContent;
      if (announcement) break;
    }

    const finalAnnouncement = screen.getByTestId('pp-announcement').textContent;
    expect(finalAnnouncement).not.toBe('');
    expect(finalAnnouncement).toContain('Caught!');
    expect(Number(screen.getByTestId('pp-catches').textContent)).toBeGreaterThan(0);
  });
});

describe('PredatorPreyChase — visibility gating (score must not accrue off-screen)', () => {
  let raf: ReturnType<typeof stubOneShotRaf>;

  beforeEach(() => {
    raf = stubOneShotRaf();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(useInView).mockReturnValue(true);
  });

  it('never starts the simulation loop while the card has not scrolled into view', () => {
    vi.mocked(useInView).mockReturnValue(false);
    render(<PredatorPreyChase />);

    act(() => raf.runFrame(0));
    act(() => raf.runFrame(500));

    // requestAnimationFrame was never even called — the effect bailed before
    // scheduling a frame, not just before advancing the timer visibly.
    expect(screen.getByTestId('pp-timer').textContent).toBe('0.0');
  });

  it('starts advancing only once useInView flips true, and pauses again when it flips back', () => {
    vi.mocked(useInView).mockReturnValue(false);
    const { rerender } = render(<PredatorPreyChase />);

    act(() => raf.runFrame(0));
    act(() => raf.runFrame(500));
    expect(screen.getByTestId('pp-timer').textContent).toBe('0.0');

    // Scrolled into view: rerender so the mocked hook's new return value is
    // picked up (matching a real IntersectionObserver callback flipping it).
    vi.mocked(useInView).mockReturnValue(true);
    rerender(<PredatorPreyChase />);
    act(() => raf.runFrame(0));
    act(() => raf.runFrame(500));
    expect(screen.getByTestId('pp-timer').textContent).not.toBe('0.0');

    const cancelSpy = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);

    // Scrolled back out: the effect's cleanup must cancel the in-flight frame.
    vi.mocked(useInView).mockReturnValue(false);
    rerender(<PredatorPreyChase />);
    expect(cancelSpy).toHaveBeenCalled();
  });
});

const FRAME_STEP_MS = 16.6667;
void CATCH_RADIUS;
