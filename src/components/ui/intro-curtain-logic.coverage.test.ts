import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  INTRO_CURTAIN_STORAGE_KEY,
  markIntroCurtainShown,
  shouldSkipInitialCurtain,
} from '@/components/ui/intro-curtain-logic';

describe('intro-curtain-logic coverage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('shouldSkipInitialCurtain', () => {
    it('returns true when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(shouldSkipInitialCurtain()).toBe(true);
    });

    it('returns true when sessionStorage has the default key set to "1"', () => {
      window.sessionStorage.setItem(INTRO_CURTAIN_STORAGE_KEY, '1');
      expect(shouldSkipInitialCurtain()).toBe(true);
    });

    it('returns true when a custom storageKey is set in sessionStorage', () => {
      const customKey = 'custom-intro-key';
      window.sessionStorage.setItem(customKey, '1');
      expect(shouldSkipInitialCurtain(customKey)).toBe(true);
    });

    it('falls through when sessionStorage.getItem throws', () => {
      vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
        throw new Error('sessionStorage unavailable');
      });
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
      expect(shouldSkipInitialCurtain()).toBe(false);
    });

    it('returns true when navigation type is back_forward after sessionStorage throws', () => {
      vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
        throw new Error('sessionStorage unavailable');
      });
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'back_forward' } as unknown as PerformanceEntry,
      ]);
      expect(shouldSkipInitialCurtain()).toBe(true);
    });

    it('falls through when performance.getEntriesByType throws and returns false', () => {
      window.sessionStorage.clear();
      vi.spyOn(performance, 'getEntriesByType').mockImplementation(() => {
        throw new Error('performance API unavailable');
      });
      expect(shouldSkipInitialCurtain()).toBe(false);
    });

    it('returns true when navigation type is back_forward', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'back_forward' } as unknown as PerformanceEntry,
      ]);
      expect(shouldSkipInitialCurtain()).toBe(true);
    });

    it('returns false when no session flag and no back_forward entry', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'navigate' } as unknown as PerformanceEntry,
      ]);
      expect(shouldSkipInitialCurtain()).toBe(false);
    });

    it('returns false when nav array is empty (no navigation entries)', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
      expect(shouldSkipInitialCurtain()).toBe(false);
    });

    it('uses the default storageKey when no argument is provided', () => {
      window.sessionStorage.setItem(INTRO_CURTAIN_STORAGE_KEY, '1');
      // calling with no argument hits the default parameter
      expect(shouldSkipInitialCurtain()).toBe(true);
    });
  });

  describe('markIntroCurtainShown', () => {
    it('sets the default storage key to "1" in sessionStorage', () => {
      markIntroCurtainShown();
      expect(window.sessionStorage.getItem(INTRO_CURTAIN_STORAGE_KEY)).toBe('1');
    });

    it('sets a custom storage key to "1" in sessionStorage', () => {
      const customKey = 'custom-intro-key';
      markIntroCurtainShown(customKey);
      expect(window.sessionStorage.getItem(customKey)).toBe('1');
    });

    it('silently ignores errors when sessionStorage.setItem throws', () => {
      vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
        throw new Error('sessionStorage unavailable');
      });
      expect(() => markIntroCurtainShown()).not.toThrow();
    });

    it('silently ignores errors with custom key when sessionStorage.setItem throws', () => {
      vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
        throw new Error('sessionStorage unavailable');
      });
      expect(() => markIntroCurtainShown('custom-key')).not.toThrow();
    });
  });
});
