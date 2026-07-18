import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import GlyphDissolveName from '@/components/hero/GlyphDissolveName';
import { GLYPH_DISSOLVE_DURATION_MS } from '@/components/hero/glyph-dissolve-logic';

const performanceProfile = {
  performanceTier: 'full' as 'full' | 'balanced' | 'lite' | 'reduced',
};
vi.mock('@/hooks/usePerformanceProfile', () => ({
  usePerformanceProfile: () => performanceProfile,
}));

const interactionMode = {
  enableHoverMotion: true,
  prefersReducedMotion: false,
  isCoarsePointer: false,
};
vi.mock('@/hooks/useInteractionMode', () => ({
  useInteractionMode: () => interactionMode,
}));

/**
 * Finish TypewriterEffect's typing animation for a given text/speed. Each
 * keystroke's setTimeout callback updates React state, whose effect then
 * schedules the NEXT setTimeout — a single big advanceTimersByTime (sync or
 * async) does NOT reliably let React commit and re-run effects between each
 * cascaded timer, so this advances one small step per act() call instead,
 * matching the established, working pattern in
 * TypewriterEffect.coverage.test.tsx ("must advance + flush React in
 * separate act() steps so cascading timers are picked up").
 */
async function finishTyping(text: string, typingSpeed = 80) {
  const steps = text.length + 2;
  for (let i = 0; i < steps; i += 1) {
    await act(async () => {
      vi.advanceTimersByTime(typingSpeed);
    });
  }
}

describe('GlyphDissolveName', () => {
  afterEach(() => {
    performanceProfile.performanceTier = 'full';
    interactionMode.enableHoverMotion = true;
    vi.useRealTimers();
  });

  it('always renders the real name as genuine text, before and after typing completes', () => {
    render(<GlyphDissolveName text="Cameron Aaron" />);
    expect(screen.getAllByText('Cameron Aaron').length).toBeGreaterThan(0);
  });

  it('does not attach hover handlers until typing has finished', () => {
    vi.useFakeTimers();
    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    fireEvent.mouseEnter(wrapper);
    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
  });

  it('does not mount a canvas on hover once typing finishes, since jsdom lacks getImageData/fillText (defensive fallback)', async () => {
    vi.useFakeTimers();
    // A real (non-zero) size, so this genuinely exercises the canvas-API feature-detect
    // guard rather than bailing out earlier at the zero-size check (a different,
    // already-covered path) — jsdom's default getBoundingClientRect() is all zeros.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 120, bottom: 24, width: 120, height: 24, toJSON: () => ({}),
    } as DOMRect);

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => {
      fireEvent.mouseEnter(wrapper);
    });

    // This environment's canvas mock (vitest.setup.ts) has no getImageData/fillText —
    // the component must feature-detect that and silently stay plain text, never throw.
    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
    expect(screen.getAllByText('Cam').length).toBeGreaterThan(0);
    vi.restoreAllMocks();
  });

  it('never attaches hover handlers on a non-full performance tier', async () => {
    performanceProfile.performanceTier = 'balanced';
    vi.useFakeTimers();
    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    expect(wrapper.onmouseenter ?? null).toBeNull();
  });

  it('never attaches hover handlers when hover motion is disabled (coarse pointer / reduced motion)', async () => {
    interactionMode.enableHoverMotion = false;
    vi.useFakeTimers();
    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    expect(wrapper.onmouseenter ?? null).toBeNull();
  });

  it('cancels any in-flight animation frame on unmount (lifecycle hygiene)', () => {
    const cancelSpy = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);

    const { unmount } = render(<GlyphDissolveName text="Cameron" />);
    unmount();

    // No frame was ever scheduled in this environment (canvas sampling no-ops), so the
    // cleanup effect runs but has nothing to cancel — asserting it doesn't throw is the point.
    expect(() => unmount).not.toThrow();
    vi.unstubAllGlobals();
  });

  it('passes typingSpeed through to the underlying TypewriterEffect', async () => {
    vi.useFakeTimers();
    render(<GlyphDissolveName text="Hi" typingSpeed={10} />);
    // A much faster typing speed should finish well before the default-speed budget.
    await finishTyping('Hi', 10);
    expect(screen.getAllByText('Hi').length).toBeGreaterThan(0);
  });
});

/**
 * This repo's shared canvas mock (vitest.setup.ts) deliberately omits
 * getImageData/fillText — every real production component before this one
 * only ever draws shapes, never samples text. Locally overriding
 * getContext here (documented, scoped to this file only, matching the
 * LOCAL_FRAMER_MOCKS precedent in test-quality-contract.test.tsx) is the
 * only way to exercise the real sampling/RAF/phase-transition path instead
 * of only ever hitting the defensive fallback above.
 */
function mockDrawableCanvasContext() {
  const calls = { fillTextArgs: [] as unknown[][], arcCount: 0 };
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(() => {
      calls.arcCount += 1;
    }),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn((...args: unknown[]) => {
      calls.fillTextArgs.push(args);
    }),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => {
      // Two "ink" pixels — enough for sampleGlyphPositions to find something real.
      const data = new Uint8ClampedArray(width * height * 4);
      data[3] = 255; // pixel (0,0)
      if (width > 1) data[(1 * 4) + 3] = 255; // pixel (1,0)
      return { width, height, data } as unknown as ImageData;
    }),
    font: '',
    fillStyle: '',
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, right: 120, bottom: 24, width: 120, height: 24, toJSON: () => ({}),
  } as DOMRect);
  return { ctx, calls };
}

/**
 * Same one-shot RAF stub pattern used by predator-prey and the hero particle
 * engines — but critically, `advanceFrame` moves vitest's FAKE clock forward
 * (the same one performance.now() reads under vi.useFakeTimers()) and then
 * hands the callback that exact performance.now() value. Real browsers give
 * requestAnimationFrame callbacks a timestamp on the SAME clock as
 * performance.now(), and this component's mouse-leave handler reads
 * performance.now() directly (correct — it's a real event, not a frame) — so
 * the stub must keep both readings on one consistent clock, or elapsed-time
 * math computed from the two together goes nonsensical.
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
    /** Advance the fake clock by `deltaMs`, then run the queued frame at that instant. */
    advanceFrame(deltaMs: number) {
      if (!active) return;
      vi.advanceTimersByTime(deltaMs);
      const cb = capturedCallback;
      capturedCallback = null;
      active = false;
      cb?.(performance.now());
      active = true;
    },
  };
}

describe('GlyphDissolveName — real sampling/RAF path (local canvas mock)', () => {
  afterEach(() => {
    performanceProfile.performanceTier = 'full';
    interactionMode.enableHoverMotion = true;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('mounts a canvas and draws sampled particles once hovered after typing completes', async () => {
    vi.useFakeTimers();
    const { calls } = mockDrawableCanvasContext();

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');
    const raf = stubOneShotRaf();

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));

    expect(screen.getByTestId('glyph-dissolve-canvas')).toBeTruthy();
    expect(calls.fillTextArgs.length).toBeGreaterThan(0);

    act(() => raf.advanceFrame(0));
    expect(calls.arcCount).toBeGreaterThan(0); // at least one particle drawn
  });

  it('transitions from entering to hovering once GLYPH_DISSOLVE_DURATION_MS elapses, and keeps animating', async () => {
    vi.useFakeTimers();
    const { calls } = mockDrawableCanvasContext();

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');
    const raf = stubOneShotRaf();

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));
    act(() => raf.advanceFrame(0)); // still entering

    const arcCountDuringEnter = calls.arcCount;
    act(() => raf.advanceFrame(GLYPH_DISSOLVE_DURATION_MS + 50)); // now hovering
    act(() => raf.advanceFrame(50)); // one more hovering-phase frame, still animating

    expect(screen.getByTestId('glyph-dissolve-canvas')).toBeTruthy();
    expect(calls.arcCount).toBeGreaterThan(arcCountDuringEnter);
  });

  it('unmounts the canvas if the real <canvas> element cannot supply a drawable context', async () => {
    vi.useFakeTimers();
    const { ctx: richCtx } = mockDrawableCanvasContext();
    // Sampling (the offscreen canvas, first getContext call) succeeds with the rich mock;
    // the real <canvas> element's OWN getContext call (inside the mount effect) gets a
    // poor context missing getImageData/fillText — this repo's defensive-fallback guard
    // must catch that and unmount the canvas rather than proceeding with a broken drawCtx.
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    getContextSpy.mockImplementationOnce(() => richCtx as unknown as CanvasRenderingContext2D);
    getContextSpy.mockReturnValue({ clearRect: vi.fn(), fillStyle: '' } as unknown as CanvasRenderingContext2D);

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));

    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
    expect(screen.getAllByText('Cam').length).toBeGreaterThan(0);
  });

  it('reassembles and unmounts the canvas after the leaving phase finishes', async () => {
    vi.useFakeTimers();
    mockDrawableCanvasContext();

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');
    const raf = stubOneShotRaf();

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));
    act(() => raf.advanceFrame(0));

    act(() => fireEvent.mouseLeave(wrapper));
    // Drive frames well past GLYPH_RESTORE_DURATION_MS (380ms).
    act(() => raf.advanceFrame(500));

    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
    expect(screen.getAllByText('Cam').length).toBeGreaterThan(0);
  });

  it('does nothing on mouse-leave if the pointer never entered (no particle buffer yet)', async () => {
    vi.useFakeTimers();
    mockDrawableCanvasContext();
    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    expect(() => act(() => fireEvent.mouseLeave(wrapper))).not.toThrow();
    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
  });

  it('bails out without mounting a canvas when the container has zero size', async () => {
    vi.useFakeTimers();
    mockDrawableCanvasContext();
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}),
    } as DOMRect);

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));
    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
  });

  it('stays plain text if getImageData throws (e.g. a tainted-canvas SecurityError)', async () => {
    vi.useFakeTimers();
    mockDrawableCanvasContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillStyle: '',
      font: '',
      textBaseline: 'alphabetic' as CanvasTextBaseline,
      fillText: vi.fn(),
      getImageData: vi.fn(() => {
        throw new Error('SecurityError: tainted canvas');
      }),
    } as unknown as CanvasRenderingContext2D);

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    expect(() => act(() => fireEvent.mouseEnter(wrapper))).not.toThrow();
    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
  });

  it('uses the computed shorthand font string directly when the browser provides one', async () => {
    vi.useFakeTimers();
    const { ctx } = mockDrawableCanvasContext();
    // jsdom's own default getComputedStyle().font is always a non-empty shorthand
    // ("medium depends on user agent"), so this truthy branch is already exercised by
    // every other test in this file — this test pins it explicitly and by name.
    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));

    expect(screen.getByTestId('glyph-dissolve-canvas')).toBeTruthy();
    expect(ctx.font.length).toBeGreaterThan(0);
  });

  it('falls back to fontSize + fontFamily when the computed shorthand font is empty', async () => {
    vi.useFakeTimers();
    const { ctx } = mockDrawableCanvasContext();
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      font: '', // falsy shorthand — some engines genuinely report this
      fontSize: '16px',
      fontFamily: 'Arial',
    } as unknown as CSSStyleDeclaration);

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));

    expect(screen.getByTestId('glyph-dissolve-canvas')).toBeTruthy();
    expect(ctx.font).toBe('16px Arial');
  });

  it('stays plain text when sampling finds zero ink pixels (e.g. a blank/transparent render)', async () => {
    vi.useFakeTimers();
    mockDrawableCanvasContext();
    // Override getImageData to report a fully-transparent buffer (no glyph ink anywhere).
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillStyle: '',
      font: '',
      textBaseline: 'alphabetic' as CanvasTextBaseline,
      fillText: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      })),
    } as unknown as CanvasRenderingContext2D);

    render(<GlyphDissolveName text="Cam" typingSpeed={80} />);
    await finishTyping('Cam');

    const wrapper = screen.getByTestId('glyph-dissolve-name');
    act(() => fireEvent.mouseEnter(wrapper));

    expect(screen.queryByTestId('glyph-dissolve-canvas')).toBeNull();
  });
});
