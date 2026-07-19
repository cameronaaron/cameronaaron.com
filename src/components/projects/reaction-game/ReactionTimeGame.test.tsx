import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView } from 'framer-motion';

import ReactionTimeGame from './ReactionTimeGame';
import { MAX_DELAY_MS, MIN_DELAY_MS, getResultMessage, getTargetAriaLabel } from './reaction-time-game-logic';

/**
 * The repo-wide vitest.setup.ts stubs requestAnimationFrame as a no-op (`() =>
 * 1`, never invoking the callback) — the component now relies on a REAL rAF
 * firing to timestamp the "go" stimulus at its actual paint frame (2026-07
 * fix for a systematic reaction-time-inflation bug), so every genuine-round
 * test needs this local override to actually run that callback, matching the
 * established pattern in PredatorPreyChase.test.tsx.
 */
function stubOneShotRaf() {
  let capturedCallback: FrameRequestCallback | null = null;

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    capturedCallback = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  return {
    /** Run the queued frame (if any) at the given timestamp (ms). */
    runFrame(timeMs: number) {
      const cb = capturedCallback;
      capturedCallback = null;
      cb?.(timeMs);
    },
  };
}

/** Advances the pre-go timer, then runs the paint-aligned rAF that stamps goTimestamp. */
function enterGoPhase(raf: ReturnType<typeof stubOneShotRaf>, paintTimeMs: number) {
  act(() => {
    vi.advanceTimersByTime(MIN_DELAY_MS);
  });
  act(() => {
    raf.runFrame(paintTimeMs);
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ReactionTimeGame — initial render (hydration safety)', () => {
  it('starts in the waiting phase with the exact waiting aria-label', () => {
    render(<ReactionTimeGame />);

    expect(screen.getByLabelText(getTargetAriaLabel('waiting'))).not.toBeNull();
  });

  it('starts with all stats showing the empty placeholder and zero rounds played', () => {
    render(<ReactionTimeGame />);

    expect(screen.getByTestId('reaction-game-last').textContent).toBe('—');
    expect(screen.getByTestId('reaction-game-average').textContent).toBe('—');
    expect(screen.getByTestId('reaction-game-best').textContent).toBe('—');
    expect(screen.getByTestId('reaction-game-rounds').textContent).toBe('0');
  });

  it('starts with no result message and no Try again button', () => {
    render(<ReactionTimeGame />);

    expect(screen.getByTestId('reaction-game-message').textContent).toBe('');
    expect(screen.queryByTestId('reaction-game-try-again')).toBeNull();
  });

  it('the target button is enabled and type="button" before any round resolves', () => {
    render(<ReactionTimeGame />);

    const target = screen.getByTestId('reaction-game-target');
    expect(target.getAttribute('type')).toBe('button');
    expect(target.hasAttribute('disabled')).toBe(false);
  });

  it('renders two independent mounts identically for the initial waiting phase', () => {
    const first = render(<ReactionTimeGame />);
    const firstLabel = screen.getByTestId('reaction-game-target').getAttribute('aria-label');
    first.unmount();

    render(<ReactionTimeGame />);
    const secondLabel = screen.getByTestId('reaction-game-target').getAttribute('aria-label');

    expect(secondLabel).toBe(firstLabel);
  });
});

describe('ReactionTimeGame — visibility gating (round must not run off-screen)', () => {
  afterEach(() => {
    vi.mocked(useInView).mockReturnValue(true);
  });

  it('never schedules the go countdown while the card has not scrolled into view', () => {
    vi.mocked(useInView).mockReturnValue(false);
    vi.useFakeTimers();
    render(<ReactionTimeGame />);

    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS * 2);
    });

    expect(screen.getByLabelText(getTargetAriaLabel('waiting'))).not.toBeNull();
  });

  it('starts the countdown once scrolled into view', () => {
    vi.mocked(useInView).mockReturnValue(false);
    vi.useFakeTimers();
    const { rerender } = render(<ReactionTimeGame />);

    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS * 2);
    });
    expect(screen.getByLabelText(getTargetAriaLabel('waiting'))).not.toBeNull();

    vi.mocked(useInView).mockReturnValue(true);
    rerender(<ReactionTimeGame />);
    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS);
    });

    expect(screen.getByLabelText(getTargetAriaLabel('go'))).not.toBeNull();
  });
});

describe('ReactionTimeGame — false start (anticipatory response)', () => {
  it('flags a click before the target changes as a false start, not a punished mistake', () => {
    render(<ReactionTimeGame />);

    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe(
      getResultMessage({ kind: 'false-start' }, false),
    );
  });

  it('is still a false start if clicked after the go timer fires but before the paint-aligned frame lands', () => {
    // The click-before-visible-stimulus window: phase has flipped to 'go' but
    // requestAnimationFrame (and therefore goTimestamp) hasn't fired yet, so
    // the player could not actually have seen the change — correctly a false
    // start, not a bug. No human can react inside a single frame anyway.
    vi.useFakeTimers();
    render(<ReactionTimeGame />);

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe(
      getResultMessage({ kind: 'false-start' }, false),
    );
  });

  it('counts the false start as a round played but never touches the reaction-time stats', () => {
    render(<ReactionTimeGame />);

    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-rounds').textContent).toBe('1');
    expect(screen.getByTestId('reaction-game-last').textContent).toBe('—');
    expect(screen.getByTestId('reaction-game-average').textContent).toBe('—');
    expect(screen.getByTestId('reaction-game-best').textContent).toBe('—');
  });

  it('disables the target and offers Try again once the round has resolved', () => {
    render(<ReactionTimeGame />);

    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-target').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('reaction-game-try-again')).not.toBeNull();
  });

  it('lets the player start a fresh round via Try again after a false start', () => {
    render(<ReactionTimeGame />);

    fireEvent.click(screen.getByTestId('reaction-game-target'));
    fireEvent.click(screen.getByTestId('reaction-game-try-again'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe('');
    expect(screen.getByLabelText(getTargetAriaLabel('waiting'))).not.toBeNull();
    expect(screen.queryByTestId('reaction-game-try-again')).toBeNull();
  });
});

describe('ReactionTimeGame — genuine timed reaction', () => {
  it('measures the reaction from the paint-aligned frame timestamp, not the setTimeout callback instant', () => {
    // Root-caused 2026-07: stamping goTimestamp inside the setTimeout callback
    // (before React re-renders and the browser paints the 'go' state)
    // systematically inflated every recorded reaction time. This pins the
    // fix — the rAF's OWN timestamp becomes goTimestamp, not an earlier value.
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const raf = stubOneShotRaf();

    render(<ReactionTimeGame />);
    enterGoPhase(raf, 5000); // paint lands well after the timer fired

    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(5220); // 220ms after the PAINT, not the timer
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe('220ms — Elite reflexes.');
    nowSpy.mockRestore();
  });

  it('computes and displays the exact reaction time, category, and updated stats', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const raf = stubOneShotRaf();

    render(<ReactionTimeGame />);
    enterGoPhase(raf, 1000);

    expect(screen.getByLabelText(getTargetAriaLabel('go'))).not.toBeNull();

    vi.spyOn(performance, 'now').mockReturnValueOnce(1220); // click timestamp — 220ms reaction
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe('220ms — Elite reflexes.');
    expect(screen.getByTestId('reaction-game-last').textContent).toBe('220ms');
    expect(screen.getByTestId('reaction-game-best').textContent).toBe('220ms');
    expect(screen.getByTestId('reaction-game-average').textContent).toBe('220ms');
    expect(screen.getByTestId('reaction-game-rounds').textContent).toBe('1');
  });

  it('accumulates the average and tracks the fastest best across two genuine rounds, flagging the new best', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const raf = stubOneShotRaf();

    render(<ReactionTimeGame />);
    enterGoPhase(raf, 1000);
    vi.spyOn(performance, 'now').mockReturnValueOnce(1300); // 300ms — typical
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe('300ms — Typical human reaction time.');

    fireEvent.click(screen.getByTestId('reaction-game-try-again'));
    enterGoPhase(raf, 2000);
    vi.spyOn(performance, 'now').mockReturnValueOnce(2200); // 200ms — elite, and the new best
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-rounds').textContent).toBe('2');
    expect(screen.getByTestId('reaction-game-best').textContent).toBe('200ms');
    expect(screen.getByTestId('reaction-game-last').textContent).toBe('200ms');
    expect(screen.getByTestId('reaction-game-average').textContent).toBe('250ms');
    expect(screen.getByTestId('reaction-game-message').textContent).toBe('200ms — Elite reflexes. New personal best!');
  });

  it('does not flag a new best on the very first genuine round', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const raf = stubOneShotRaf();

    render(<ReactionTimeGame />);
    enterGoPhase(raf, 1000);
    vi.spyOn(performance, 'now').mockReturnValueOnce(1220);
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe('220ms — Elite reflexes.');
  });

  it('does not flag a new best when the round is slower than the existing best', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const raf = stubOneShotRaf();

    render(<ReactionTimeGame />);
    enterGoPhase(raf, 1000);
    vi.spyOn(performance, 'now').mockReturnValueOnce(1200); // 200ms best
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    fireEvent.click(screen.getByTestId('reaction-game-try-again'));
    enterGoPhase(raf, 2000);
    vi.spyOn(performance, 'now').mockReturnValueOnce(2350); // 350ms — slower than the 200ms best
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-message').textContent).toBe('350ms — Typical human reaction time.');
  });

  it('ignores further clicks once a round has resolved', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const raf = stubOneShotRaf();

    render(<ReactionTimeGame />);
    enterGoPhase(raf, 1000);
    vi.spyOn(performance, 'now').mockReturnValueOnce(1250);
    const target = screen.getByTestId('reaction-game-target');
    fireEvent.click(target);
    fireEvent.click(target);
    fireEvent.click(target);

    expect(screen.getByTestId('reaction-game-rounds').textContent).toBe('1');
  });
});

describe('ReactionTimeGame — lifecycle hygiene', () => {
  it('clears the pending go timer on unmount so it can never fire against a destroyed instance', () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(<ReactionTimeGame />);
    unmount();

    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS + 1000);
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('cancels the pending go-frame on unmount once the go phase has started', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const cancelSpy = vi.fn();
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);

    const { unmount } = render(<ReactionTimeGame />);
    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('clears the previous timer when Try again starts a new round (no duplicate go transitions)', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<ReactionTimeGame />);

    // False start immediately — this must cancel the pending go-timer from mount.
    fireEvent.click(screen.getByTestId('reaction-game-target'));
    fireEvent.click(screen.getByTestId('reaction-game-try-again'));

    // If the original timer had leaked, advancing by its full delay here would
    // fire it on top of the fresh round's own timer. Either way the target
    // should end up in exactly the 'go' state, not throw, and not double-fire.
    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });

    expect(screen.getByLabelText(getTargetAriaLabel('go'))).not.toBeNull();
  });
});

describe('ReactionTimeGame — accessibility basics', () => {
  it('surfaces the round result through a polite status live region', () => {
    render(<ReactionTimeGame />);

    const message = screen.getByTestId('reaction-game-message');
    expect(message.getAttribute('role')).toBe('status');
    expect(message.getAttribute('aria-live')).toBe('polite');
  });

  it('the target button has an explicit type and a descriptive aria-label', () => {
    render(<ReactionTimeGame />);

    const target = screen.getByTestId('reaction-game-target');
    expect(target.getAttribute('type')).toBe('button');
    expect(target.getAttribute('aria-label')).toBe(getTargetAriaLabel('waiting'));
  });

  it('the Try again button has an explicit type to satisfy the WCAG button-type contract', () => {
    render(<ReactionTimeGame />);
    fireEvent.click(screen.getByTestId('reaction-game-target'));

    expect(screen.getByTestId('reaction-game-try-again').getAttribute('type')).toBe('button');
  });

  it('updates the target aria-label to the exact go-state label once the round goes live', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<ReactionTimeGame />);
    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });

    expect(screen.getByTestId('reaction-game-target').getAttribute('aria-label')).toBe('Go! Click now');
  });
});
