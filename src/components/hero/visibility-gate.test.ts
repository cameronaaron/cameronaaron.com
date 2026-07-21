import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gateLoopOnVisibility } from '@/components/hero/visibility-gate';

// Minimal IntersectionObserver double whose callback we can fire on demand.
class FakeIntersectionObserver {
  static last: FakeIntersectionObserver | null = null;
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  disconnected = false;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    FakeIntersectionObserver.last = this;
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  disconnect() {
    this.disconnected = true;
  }
  fire(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

describe('gateLoopOnVisibility', () => {
  let element: Element;
  let hidden: boolean;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    FakeIntersectionObserver.last = null;
    element = document.createElement('div');
    hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not resume/pause spuriously while it stays visible', () => {
    const onResume = vi.fn();
    const onPause = vi.fn();
    gateLoopOnVisibility(element, { onResume, onPause });
    // Starts running; an intersecting callback is a no-op transition.
    FakeIntersectionObserver.last!.fire(true);
    expect(onResume).not.toHaveBeenCalled();
    expect(onPause).not.toHaveBeenCalled();
  });

  it('pauses when scrolled off-screen and resumes when back', () => {
    const onResume = vi.fn();
    const onPause = vi.fn();
    gateLoopOnVisibility(element, { onResume, onPause });

    FakeIntersectionObserver.last!.fire(false);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();

    FakeIntersectionObserver.last!.fire(true);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('pauses when the tab is hidden even though the element is on-screen', () => {
    const onResume = vi.fn();
    const onPause = vi.fn();
    gateLoopOnVisibility(element, { onResume, onPause });

    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onPause).toHaveBeenCalledTimes(1);

    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('stays paused when the tab returns to foreground while still off-screen', () => {
    const onResume = vi.fn();
    const onPause = vi.fn();
    gateLoopOnVisibility(element, { onResume, onPause });

    FakeIntersectionObserver.last!.fire(false); // off-screen → pause
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange')); // already paused, no-op
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange')); // foreground but STILL off-screen
    expect(onResume).not.toHaveBeenCalled();
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('cleanup disconnects the observer and removes the visibility listener', () => {
    const onResume = vi.fn();
    const onPause = vi.fn();
    const release = gateLoopOnVisibility(element, { onResume, onPause });
    const observer = FakeIntersectionObserver.last!;

    release();
    expect(observer.disconnected).toBe(true);

    // After cleanup, a visibility change must not fire callbacks.
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onPause).not.toHaveBeenCalled();
  });
});
