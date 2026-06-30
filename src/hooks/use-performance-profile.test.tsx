import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_DEVICE_MEMORY_GB,
  DEFAULT_HARDWARE_CONCURRENCY,
  LOW_HARDWARE_CORES_THRESHOLD,
  LOW_HARDWARE_MEMORY_GB_THRESHOLD,
  usePerformanceProfile,
} from './usePerformanceProfile';

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

describe('usePerformanceProfile — exported constants', () => {
  it('hardware threshold constants have correct values', () => {
    expect(LOW_HARDWARE_CORES_THRESHOLD).toBe(4);
    expect(LOW_HARDWARE_MEMORY_GB_THRESHOLD).toBe(4);
    expect(DEFAULT_HARDWARE_CONCURRENCY).toBe(8);
    expect(DEFAULT_DEVICE_MEMORY_GB).toBe(8);
  });

  it('lite tier triggers at exactly the threshold boundary (cores === threshold → lite)', () => {
    installMatchMedia(false);
    setHardware(LOW_HARDWARE_CORES_THRESHOLD, 16);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('lite');
  });

  it('full tier triggers one step above the threshold (cores === threshold + 1)', () => {
    installMatchMedia(false);
    setHardware(LOW_HARDWARE_CORES_THRESHOLD + 1, LOW_HARDWARE_MEMORY_GB_THRESHOLD + 1);
    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('full');
  });
});

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

  it('covers navigator-undefined guard in getConnection and lowHardware useState', () => {
    installMatchMedia(false);

    // Stub navigator to undefined so typeof navigator === 'undefined' paths are taken
    const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
      ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis) as object, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true, writable: true });

    try {
      const { result } = renderHook(() => usePerformanceProfile());
      // getConnection() returns null (line 15), lowHardware returns false (line 41)
      expect(result.current.saveDataEnabled).toBe(false);
      expect(result.current.performanceTier).toBe('full');
    } finally {
      if (origDescriptor) {
        Object.defineProperty(globalThis, 'navigator', origDescriptor);
      }
    }
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
