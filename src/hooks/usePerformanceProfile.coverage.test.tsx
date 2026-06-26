import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePerformanceProfile } from './usePerformanceProfile';

const makeMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: makeMatchMedia(false),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('usePerformanceProfile coverage', () => {
  it('detects low-hardware when hardwareConcurrency <= 4', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 2 });
    Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });

    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).not.toBe('full');
  });

  it('detects low-hardware when deviceMemory <= 4', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 2 });

    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).not.toBe('full');
  });

  it('returns lite tier when saveData is enabled via navigator.connection', () => {
    const mockConnection = {
      saveData: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: mockConnection,
    });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });

    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('lite');

    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
  });

  it('fires pointer-change media query listener to update isCoarsePointer', () => {
    let pointerListener: ((e: MediaQueryListEvent) => void) | undefined;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn().mockImplementation((event: string, cb: (e: MediaQueryListEvent) => void) => {
          if (query.includes('coarse')) pointerListener = cb;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.isCoarsePointer).toBe(false);

    act(() => {
      pointerListener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current.isCoarsePointer).toBe(true);
  });

  it('fires connection change listener to update saveData and lowHardware', () => {
    let connectionListener: (() => void) | undefined;
    const mockConnection = {
      saveData: false,
      addEventListener: vi.fn().mockImplementation((_: string, cb: () => void) => {
        connectionListener = cb;
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: mockConnection,
    });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });

    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('full');

    mockConnection.saveData = true;
    act(() => { connectionListener?.(); });

    expect(result.current.performanceTier).toBe('lite');

    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
  });

  it('handles missing navigator gracefully (getConnection returns null path)', () => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });

    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.performanceTier).toBe('full');
  });

  it('returns balanced tier for coarse pointer (touch/mobile)', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: makeMatchMedia(true),
    });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });

    const { result } = renderHook(() => usePerformanceProfile());
    expect(result.current.isCoarsePointer).toBe(true);
    expect(result.current.performanceTier).toBe('balanced');
  });
});
