import { describe, expect, it, vi } from 'vitest';
import {
  INTRO_CURTAIN_STORAGE_KEY,
  REDUCED_MOTION_MAX_HOLD_MS,
  getEffectiveHoldMs,
  markIntroCurtainShown,
  shouldSkipInitialCurtain,
} from '@/components/ui/intro-curtain-logic';

describe('intro curtain logic', () => {
  it('skips when session storage flag is present', () => {
    window.sessionStorage.setItem(INTRO_CURTAIN_STORAGE_KEY, '1');
    expect(shouldSkipInitialCurtain()).toBe(true);
  });

  it('skips on back-forward navigation entries', () => {
    const original = performance.getEntriesByType.bind(performance);
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((name: string) => {
      if (name === 'navigation') {
        return [{ type: 'back_forward' } as unknown as PerformanceEntry];
      }
      return original(name);
    });

    expect(shouldSkipInitialCurtain()).toBe(true);
  });

  it('marks the curtain as shown in session storage', () => {
    markIntroCurtainShown();
    expect(window.sessionStorage.getItem(INTRO_CURTAIN_STORAGE_KEY)).toBe('1');
  });

  it('passes the hold through unchanged when motion is not reduced', () => {
    expect(getEffectiveHoldMs(400, false)).toBe(400);
    expect(getEffectiveHoldMs(5000, false)).toBe(5000);
  });

  it('clamps the hold to the reduced-motion ceiling', () => {
    expect(getEffectiveHoldMs(5000, true)).toBe(REDUCED_MOTION_MAX_HOLD_MS);
    expect(getEffectiveHoldMs(100, true)).toBe(100);
  });
});
