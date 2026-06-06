import { describe, expect, it, vi } from 'vitest';
import {
  INTRO_CURTAIN_STORAGE_KEY,
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
});
