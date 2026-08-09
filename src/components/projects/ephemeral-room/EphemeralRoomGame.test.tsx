import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EphemeralRoomGame from './EphemeralRoomGame';
import { ROOM_TIMEOUT_MS } from './ephemeral-room-logic';

// EphemeralRoomGame self-reads the performance tier and gates its whole
// animated UI on it (paused branch vs. live decay-bar branch). Drive it
// through the hook mock, same pattern as ribbon-band.test.tsx.
let mockTier = 'full';
vi.mock('@/hooks/usePerformanceProfile', () => ({
  usePerformanceProfile: () => ({ performanceTier: mockTier }),
}));

// Manual rAF queue so the frame loop can be stepped deterministically.
let rafQueue: FrameRequestCallback[] = [];

function flushFrames(count: number, stepMs = 250): void {
  act(() => {
    for (let i = 0; i < count; i += 1) {
      const queue = rafQueue;
      rafQueue = [];
      for (const callback of queue) callback(i * stepMs);
    }
  });
}

beforeEach(() => {
  rafQueue = [];
  mockTier = 'full';
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  // Pin Math.random near 1 so stranger arrivals (which need randomDraw below
  // a small arrival-chance threshold) never fire — the silence clock ticks
  // up deterministically instead of racing against simulated chatter.
  vi.spyOn(Math, 'random').mockReturnValue(0.999999);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('EphemeralRoomGame', () => {
  it('renders the live decay UI on the full tier', () => {
    render(<EphemeralRoomGame />);

    expect(screen.getByTestId('room-decay-bar')).toBeTruthy();
    expect(screen.getByTestId('room-send')).toBeTruthy();
    expect(screen.getByTestId('room-chatters')).toBeTruthy();
    expect(screen.queryByTestId('room-paused')).toBeNull();
  });

  it('renders the paused fallback on a low tier and never starts the frame loop', () => {
    mockTier = 'lite';
    render(<EphemeralRoomGame />);

    expect(screen.getByTestId('room-paused')).toBeTruthy();
    expect(screen.queryByTestId('room-decay-bar')).toBeNull();
    expect(rafQueue.length).toBe(0);
  });

  it('sending a message increments the message counter', () => {
    render(<EphemeralRoomGame />);
    fireEvent.click(screen.getByTestId('room-send'));

    expect(screen.getByTestId('room-messages').textContent).toBe('1');
  });

  it('moving the chatters slider updates the displayed count', () => {
    render(<EphemeralRoomGame />);
    fireEvent.change(screen.getByTestId('room-chatters'), { target: { value: '3' } });

    expect(screen.getByText('Others in room: 3')).toBeTruthy();
  });

  it('a stranger arrival during the frame loop updates the message counter passively', () => {
    // Force Math.random low enough that computeArrivalChance's threshold is
    // always cleared (default DEFAULT_CHATTERS=1 keeps the chance > 0), so
    // the tick loop's own `state.messages !== messagesRef.current` diff path
    // fires — not the handleSend button click path exercised elsewhere.
    (Math.random as ReturnType<typeof vi.fn>).mockReturnValue(0);
    render(<EphemeralRoomGame />);

    flushFrames(2);

    expect(screen.getByTestId('room-messages').textContent).toBe('1');
  });

  it('the room fades after enough silent frames, and sending a message revives it', () => {
    render(<EphemeralRoomGame />);
    // Set chatters to 0 to remove any residual arrival chance entirely, then
    // flush enough 250ms frames to exceed ROOM_TIMEOUT_MS of pure silence.
    fireEvent.change(screen.getByTestId('room-chatters'), { target: { value: '0' } });
    flushFrames(Math.ceil(ROOM_TIMEOUT_MS / 250) + 2);

    expect(screen.getByTestId('room-status').textContent).toContain('faded');
    expect(screen.getByTestId('room-send').textContent).toBe('Restart the room');

    fireEvent.click(screen.getByTestId('room-send'));

    expect(screen.getByTestId('room-send').textContent).toBe('Send a message');
  });

  it('shows "people" (not "person") in the paused fallback when chatters is not 1', () => {
    const { rerender } = render(<EphemeralRoomGame />);
    fireEvent.change(screen.getByTestId('room-chatters'), { target: { value: '2' } });

    mockTier = 'lite';
    rerender(<EphemeralRoomGame />);

    expect(screen.getByTestId('room-paused').textContent).toContain('2 other people');
  });

  it('a stale queued frame after unmount writes to nothing (both refs already detached)', () => {
    // cancelAnimationFrame is stubbed as a no-op in this file's rAF mock, so
    // a tick already queued at unmount never actually gets removed — exactly
    // like a real cancelAnimationFrame call racing against a frame the
    // browser already committed to firing. The clock span renders regardless
    // of tier (only the decay bar is tier-gated), so a full unmount is the
    // only way to null both barRef and clockRef at once. Manually invoking
    // the stale callback exercises both guards defensively — the same
    // "test the guard directly" approach as the onResume double-call tests
    // in particles-and-engines-coverage.test.tsx.
    const { unmount } = render(<EphemeralRoomGame />);
    expect(rafQueue.length).toBe(1);
    const staleTick = rafQueue[0];

    unmount();

    expect(() => staleTick(250)).not.toThrow();
  });
});
