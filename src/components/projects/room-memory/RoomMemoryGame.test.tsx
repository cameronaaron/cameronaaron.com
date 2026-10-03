import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView } from 'framer-motion';

import RoomMemoryGame from './RoomMemoryGame';
import { ROOM_ARIA_LABEL } from './room-memory-logic';

function stubRaf() {
  let queued: FrameRequestCallback | null = null;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queued = cb;
    return 1;
  });
  const cancel = vi.fn();
  vi.stubGlobal('cancelAnimationFrame', cancel);
  return {
    cancel,
    run(timeMs: number) {
      const cb = queued;
      queued = null;
      act(() => cb?.(timeMs));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock('@/hooks/usePerformanceProfile');
});

describe('RoomMemoryGame', () => {
  it('renders an empty, keyboard-focusable room', () => {
    render(<RoomMemoryGame />);
    const canvas = screen.getByTestId('room-canvas');
    expect(canvas.getAttribute('aria-label')).toBe(ROOM_ARIA_LABEL);
    expect(canvas.getAttribute('tabindex')).toBe('0');
    expect(canvas.getAttribute('width')).toBe('64');
    expect(screen.getByTestId('room-status').textContent).toBe('The room is empty. It is forgetting.');
  });

  it('walks a body in with the arrow keys and remembers it standing still', () => {
    const raf = stubRaf();
    render(<RoomMemoryGame />);
    fireEvent.keyDown(screen.getByTestId('room-canvas'), { key: 'ArrowRight' });
    raf.run(0);
    raf.run(500);
    expect(screen.getByTestId('room-status').textContent).toBe('Still. The room is remembering you deeply.');
    expect(screen.getByTestId('room-body').style.opacity).toBe('1');
    expect(screen.getByTestId('room-density').textContent).not.toBe('0.0‰ of the room remembered');
    const context = vi.mocked(HTMLCanvasElement.prototype.getContext).mock.results.at(-1)!.value as {
      putImageData: ReturnType<typeof vi.fn>;
    };
    const [image, x, y] = context.putImageData.mock.calls.at(-1)!;
    expect([x, y]).toEqual([0, 0]);
    // Some cell near the body has been lit with the memory teal.
    expect((image as { data: Uint8ClampedArray }).data.some((value, index) => index % 4 === 2 && value > 0)).toBe(true);
  });

  it('forgets the body when the pointer leaves', () => {
    const raf = stubRaf();
    render(<RoomMemoryGame />);
    fireEvent.keyDown(screen.getByTestId('room-canvas'), { key: 'ArrowUp' });
    raf.run(0);
    raf.run(100);
    fireEvent.pointerLeave(screen.getByTestId('room-canvas'));
    raf.run(200);
    expect(screen.getByTestId('room-status').textContent).toBe('The room is empty. It is forgetting.');
    expect(screen.getByTestId('room-body').style.opacity).toBe('0');
  });

  it('places the body where the pointer is over the canvas', () => {
    const raf = stubRaf();
    render(<RoomMemoryGame />);
    const canvas = screen.getByTestId('room-canvas');
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 50, width: 200, height: 100 } as DOMRect);

    // Three-quarters across, a quarter down the room.
    fireEvent.pointerMove(canvas, { clientX: 250, clientY: 75 });
    raf.run(0);
    raf.run(2000);

    const body = screen.getByTestId('room-body');
    expect(body.style.opacity).toBe('1');
    const [, x, y] = /translate\(([\d.]+)cqw, ([\d.]+)cqh\)/.exec(body.style.transform)!.map(Number);
    expect(x).toBeCloseTo(75, 0);
    expect(y).toBeCloseTo(25, 0);
  });

  it('keeps the room live when the canvas has no 2D context', () => {
    const raf = stubRaf();
    // The setup's canvas stub is shared and never restored: override one call only.
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValueOnce(null);
    render(<RoomMemoryGame />);
    fireEvent.keyDown(screen.getByTestId('room-canvas'), { key: 'ArrowRight' });
    raf.run(0);
    raf.run(500);

    // No field is painted, but the body and its status still track the room.
    expect(screen.getByTestId('room-body').style.opacity).toBe('1');
    expect(screen.getByTestId('room-status').textContent).toBe('Still. The room is remembering you deeply.');
  });

  it('ignores keys that are not arrows', () => {
    const raf = stubRaf();
    render(<RoomMemoryGame />);
    fireEvent.keyDown(screen.getByTestId('room-canvas'), { key: 'Enter' });
    raf.run(0);
    raf.run(200);
    expect(screen.getByTestId('room-status').textContent).toBe('The room is empty. It is forgetting.');
  });

  it('does not run the loop while scrolled out of view', () => {
    const raf = stubRaf();
    vi.mocked(useInView).mockReturnValue(false);
    const spy = vi.spyOn(globalThis, 'requestAnimationFrame');
    render(<RoomMemoryGame />);
    expect(spy).not.toHaveBeenCalled();
    vi.mocked(useInView).mockReturnValue(true);
    expect(raf.cancel).not.toHaveBeenCalled();
  });

  it('shows a paused room on tiers without headroom for motion', async () => {
    vi.resetModules();
    vi.doMock('@/hooks/usePerformanceProfile', () => ({ usePerformanceProfile: () => ({ performanceTier: 'reduced' }) }));
    const { default: Paused } = await import('./RoomMemoryGame');
    render(<Paused />);
    expect(screen.getByTestId('room-paused')).toBeTruthy();
    expect(screen.queryByTestId('room-canvas')).toBeNull();
  });
});
