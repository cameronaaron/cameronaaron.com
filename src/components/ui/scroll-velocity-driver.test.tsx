import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollVelocityDriver from './ScrollVelocityDriver';

// Controllable tier: the driver only publishes on the full tier.
const profile = { performanceTier: 'full' as string };
vi.mock('@/hooks/usePerformanceProfile', () => ({
  usePerformanceProfile: () => profile,
}));

let rafQueue: Array<{ id: number; callback: FrameRequestCallback }> = [];
let nextRafId = 1;

/** Run the currently-queued frames, feeding each a synthetic timestamp. */
function flushFrames(frames: number, startMs = 1000, stepMs = 16): number {
  let executed = 0;
  let now = startMs;
  for (let i = 0; i < frames; i += 1) {
    if (rafQueue.length === 0) break;
    const queue = rafQueue;
    rafQueue = [];
    for (const entry of queue) {
      entry.callback(now);
      executed += 1;
    }
    now += stepMs;
  }
  return executed;
}

/**
 * The driver writes to elements the page already rendered, so every test needs
 * real consumers present before it mounts — one of each marker class, matching
 * the shipped page's shape (a forward band, a reverse band, a title).
 */
let consumers: HTMLElement;
function mountConsumers() {
  consumers = document.createElement('div');
  consumers.innerHTML =
    '<div class="velocity-lean-band"></div>' +
    '<div class="velocity-lean-band-reverse"></div>' +
    '<div class="velocity-lean-title"></div>';
  document.body.appendChild(consumers);
}

function readPublished() {
  const pick = (selector: string) =>
    (document.querySelector(selector) as HTMLElement | null)?.style.transform ?? 'MISSING';
  return {
    band: pick('.velocity-lean-band'),
    reverseBand: pick('.velocity-lean-band-reverse'),
    title: pick('.velocity-lean-title'),
  };
}

const CLEARED = { band: '', reverseBand: '', title: '' };

describe('ScrollVelocityDriver', () => {
  beforeEach(() => {
    profile.performanceTier = 'full';
    rafQueue = [];
    nextRafId = 1;
    window.scrollY = 0;
    mountConsumers();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = nextRafId;
      nextRafId += 1;
      rafQueue.push({ id, callback });
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafQueue = rafQueue.filter((entry) => entry.id !== id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    consumers.remove();
  });

  it('renders no DOM of its own', () => {
    const { container } = render(<ScrollVelocityDriver />);
    expect(container.innerHTML).toBe('');
  });

  it('registers its scroll listener passively (§3.3)', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<ScrollVelocityDriver />);
    const scrollCall = addSpy.mock.calls.find(([type]) => type === 'scroll');
    expect(scrollCall).toBeDefined();
    expect(scrollCall?.[2]).toEqual({ passive: true });
  });

  it('schedules no frame until a scroll actually happens', () => {
    render(<ScrollVelocityDriver />);
    expect(rafQueue).toHaveLength(0);
  });

  it('publishes a non-zero lean while the page is being scrolled', () => {
    render(<ScrollVelocityDriver />);

    // First frame establishes the baseline (no previous timestamp), the second
    // sees a real 600px jump and produces the velocity.
    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 1000);
    window.scrollY = 600;
    flushFrames(1, 1016);

    const published = readPublished();
    // 600px in one 16ms frame saturates the clamp, so the first published frame
    // is an exact, fully-determined value rather than a "something happened".
    expect(published.band).toBe('skewX(5deg) translateX(-110px)');
    expect(published.reverseBand).toBe('skewX(5deg) translateX(110px)');
    expect(published.title).toBe('skewX(2.75deg)');
  });

  it('writes the lean to every consumer of a class, not just the first', () => {
    consumers.insertAdjacentHTML('beforeend', '<div class="velocity-lean-title" id="second-title"></div>');
    render(<ScrollVelocityDriver />);

    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 1000);
    window.scrollY = 600;
    flushFrames(1, 1016);

    const second = document.getElementById('second-title') as HTMLElement;
    expect(second.style.transform).toBe('skewX(2.75deg)');
  });

  it('does nothing at all when the page renders no lean consumers', () => {
    consumers.remove();
    const addSpy = vi.spyOn(window, 'addEventListener');

    render(<ScrollVelocityDriver />);
    window.dispatchEvent(new Event('scroll'));

    expect(addSpy.mock.calls.some(([type]) => type === 'scroll')).toBe(false);
    expect(rafQueue).toHaveLength(0);
    mountConsumers(); // restore for afterEach cleanup
  });

  it('coalesces a burst of scroll events into a single frame (§3.2)', () => {
    render(<ScrollVelocityDriver />);
    for (let i = 0; i < 20; i += 1) window.dispatchEvent(new Event('scroll'));
    expect(rafQueue).toHaveLength(1);
  });

  it('settles back to exact identity and parks its loop once scrolling stops', () => {
    render(<ScrollVelocityDriver />);

    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 1000);
    window.scrollY = 600;
    flushFrames(1, 1016);
    expect(readPublished().band).toBe('skewX(5deg) translateX(-110px)');

    // scrollY stops changing, so the spring's target is 0 and it decays to rest.
    flushFrames(400, 1032);

    // Cleared outright, not left holding an identity transform — an identity
    // transform still pins each consumer to its own compositing layer.
    expect(readPublished()).toEqual(CLEARED);
    expect(rafQueue).toHaveLength(0);
  });

  it('parks and clears even when scrollY keeps easing by fractional amounts', () => {
    // Reproduces the shipped desktop bug: Lenis eases scrollY asymptotically,
    // so the delta shrinks toward zero without ever reaching it. A `=== 0`
    // park condition never fires, the loop never sleeps, and the lean stays
    // applied forever. Found in a real browser, pinned here.
    render(<ScrollVelocityDriver />);

    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 1000);

    let now = 1016;
    let position = 600;
    window.scrollY = position;
    flushFrames(1, now);
    expect(readPublished().band).not.toBe('');

    // Harmonic easing tail: the per-frame delta shrinks toward zero but is
    // never equal to it — deliberately NOT a geometric decay, which underflows
    // to an exact 0.0 delta after enough frames and would let the very bug this
    // test pins satisfy a `=== 0` park condition anyway (verified: with a
    // geometric tail this test passes against the broken implementation).
    for (let i = 0; i < 200; i += 1) {
      position += 0.5 / (i + 1);
      window.scrollY = position;
      now += 16;
      if (flushFrames(1, now) === 0) break;
    }

    expect(readPublished()).toEqual(CLEARED);
    expect(rafQueue).toHaveLength(0);
  });

  it('re-arms the loop on the next scroll after parking', () => {
    render(<ScrollVelocityDriver />);
    window.dispatchEvent(new Event('scroll'));
    flushFrames(400, 1000);
    expect(rafQueue).toHaveLength(0);

    window.dispatchEvent(new Event('scroll'));
    expect(rafQueue).toHaveLength(1);
  });

  it('never touches the DOM or listens for scroll below the full tier', () => {
    profile.performanceTier = 'balanced';
    const addSpy = vi.spyOn(window, 'addEventListener');

    render(<ScrollVelocityDriver />);
    window.dispatchEvent(new Event('scroll'));

    expect(addSpy.mock.calls.some(([type]) => type === 'scroll')).toBe(false);
    expect(rafQueue).toHaveLength(0);
    expect(readPublished()).toEqual(CLEARED);
  });

  it.each(['lite', 'reduced'])('stays inert on the %s tier', (tier) => {
    profile.performanceTier = tier;
    render(<ScrollVelocityDriver />);
    window.dispatchEvent(new Event('scroll'));
    expect(rafQueue).toHaveLength(0);
    expect(readPublished()).toEqual(CLEARED);
  });

  it('removes its listener, cancels its frame, and clears its properties on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ScrollVelocityDriver />);

    window.dispatchEvent(new Event('scroll'));
    flushFrames(1, 1000);
    window.scrollY = 600;
    flushFrames(1, 1016);
    expect(rafQueue.length).toBeGreaterThan(0);

    unmount();

    expect(removeSpy.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
    expect(rafQueue).toHaveLength(0);
    expect(readPublished()).toEqual(CLEARED);
  });
});
