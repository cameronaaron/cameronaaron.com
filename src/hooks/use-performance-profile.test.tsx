import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePerformanceProfile } from './usePerformanceProfile';

interface MediaQueryListLike {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: (event: MediaQueryListEvent) => boolean;
}

type ChangeListener = (event: MediaQueryListEvent) => void;

interface FakeConnection {
  saveData: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  __listeners: Array<EventListener>;
}

function installMatchMedia(initialCoarse: boolean) {
  const listeners: ChangeListener[] = [];
  let matches = initialCoarse;

  const media: MediaQueryListLike = {
    media: '(pointer: coarse)',
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_type: string, cb: ChangeListener) => listeners.push(cb)),
    removeEventListener: vi.fn((_type: string, cb: ChangeListener) => {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    }),
    dispatchEvent: () => true,
  };

  vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList);

  return {
    media,
    fire(next: boolean) {
      matches = next;
      for (const listener of [...listeners]) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
}

function installConnection(saveData: boolean): FakeConnection {
  const listeners: EventListener[] = [];
  const fake: FakeConnection = {
    saveData,
    addEventListener: vi.fn((_type: string, cb: EventListener) => listeners.push(cb)),
    removeEventListener: vi.fn((_type: string, cb: EventListener) => {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    }),
    __listeners: listeners,
  };
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: fake,
  });
  return fake;
}

function setHardware(cores: number, memory: number) {
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    configurable: true,
    value: cores,
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    configurable: true,
    value: memory,
  });
}

describe('usePerformanceProfile', () => {
  beforeEach(() => {
    // Reset between tests
    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the "full" tier on a fine-pointer, high-spec device', () => {
    installMatchMedia(false);
    setHardware(16, 16);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('full');
    expect(result.current.shouldRenderCursorTrail).toBe(true);
    expect(result.current.shouldRenderHeavyEffects).toBe(true);
    expect(result.current.shouldRenderAmbientEffects).toBe(true);
    expect(result.current.shouldRenderParticles).toBe(true);
  });

  it('returns "balanced" on touch devices without low-power signals', () => {
    installMatchMedia(true);
    setHardware(16, 16);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('balanced');
    expect(result.current.shouldRenderCursorTrail).toBe(false);
    expect(result.current.shouldRenderAmbientEffects).toBe(true);
    // Particle systems (canvas RAF loops) must not run on mobile
    expect(result.current.shouldRenderParticles).toBe(false);
  });

  it('returns "lite" when save-data is enabled', () => {
    installMatchMedia(false);
    setHardware(16, 16);
    installConnection(true);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('lite');
    expect(result.current.shouldRenderAmbientEffects).toBe(false);
    expect(result.current.shouldRenderParticles).toBe(false);
  });

  it('returns "lite" on low-hardware devices (<= 4 cores)', () => {
    installMatchMedia(false);
    setHardware(2, 16);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('lite');
  });

  it('returns "lite" on low-memory devices (<= 4 GB)', () => {
    installMatchMedia(false);
    setHardware(16, 2);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('lite');
  });

  it('returns "reduced" when the user prefers reduced motion', async () => {
    const fm = await import('framer-motion');
    vi.spyOn(fm, 'useReducedMotion').mockReturnValue(true);
    installMatchMedia(true);
    setHardware(16, 16);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('reduced');
    expect(result.current.shouldRenderAmbientEffects).toBe(false);
    expect(result.current.shouldRenderHeavyEffects).toBe(false);
  });

  it('transitions tiers when the pointer media-query flips', () => {
    const handle = installMatchMedia(false);
    setHardware(16, 16);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('full');

    act(() => {
      handle.fire(true);
    });
    expect(result.current.performanceTier).toBe('balanced');

    act(() => {
      handle.fire(false);
    });
    expect(result.current.performanceTier).toBe('full');
  });

  it('transitions to "lite" when the connection emits a save-data change', () => {
    installMatchMedia(false);
    setHardware(16, 16);
    const conn = installConnection(false);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('full');

    act(() => {
      conn.saveData = true;
      for (const listener of conn.__listeners) listener(new Event('change'));
    });
    expect(result.current.performanceTier).toBe('lite');
  });

  it('cleans up media-query and connection listeners on unmount', () => {
    const handle = installMatchMedia(false);
    setHardware(16, 16);
    const conn = installConnection(false);
    const { unmount } = renderHook(() => usePerformanceProfile());
    unmount();
    expect(handle.media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(conn.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('tolerates browsers without navigator.connection', () => {
    installMatchMedia(false);
    setHardware(16, 16);
    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('full');
    expect(result.current.saveDataEnabled).toBe(false);
  });

  it('falls back to webkit/moz connection objects when present', () => {
    installMatchMedia(false);
    setHardware(16, 16);
    const fake = {
      saveData: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'webkitConnection', { configurable: true, value: fake });
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('lite');
    Object.defineProperty(navigator, 'webkitConnection', { configurable: true, value: undefined });
  });
});
