import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  markTypewriterComplete,
  readInitialComplete,
} from '@/components/ui/typewriter-effect-logic';

describe('typewriter-effect-logic — coverage hardening', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readInitialComplete — window undefined branch', () => {
    it('returns false when window is undefined', () => {
      // Temporarily make typeof window appear as 'undefined' by deleting the global.
      // jsdom does not allow full deletion, so we patch the module under test by
      // overriding the global temporarily via Object.defineProperty trick on globalThis.
      const originalWindow = globalThis.window;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete globalThis.window;
      try {
        expect(readInitialComplete('any-key')).toBe(false);
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });

  describe('readInitialComplete — sessionStorage throws (catch branch)', () => {
    it('falls through to performance check when sessionStorage.getItem throws', () => {
      vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      // performance has no navigation entry → should fall through to return false
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
      expect(readInitialComplete('any-key')).toBe(false);
    });
  });

  describe('readInitialComplete — performance.getEntriesByType throws (catch branch)', () => {
    it('returns false when performance.getEntriesByType throws', () => {
      // sessionStorage returns null (no match) so first try falls through
      window.sessionStorage.removeItem('any-key');
      vi.spyOn(performance, 'getEntriesByType').mockImplementation(() => {
        throw new Error('NotSupportedError');
      });
      expect(readInitialComplete('any-key')).toBe(false);
    });
  });

  describe('readInitialComplete — navigation type is not back_forward', () => {
    it('returns false when navigation entry type is "navigate"', () => {
      window.sessionStorage.removeItem('any-key');
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'navigate' } as unknown as PerformanceEntry,
      ]);
      expect(readInitialComplete('any-key')).toBe(false);
    });

    it('returns false when navigation entries array is empty', () => {
      window.sessionStorage.removeItem('any-key');
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
      expect(readInitialComplete('any-key')).toBe(false);
    });
  });

  describe('markTypewriterComplete — sessionStorage.setItem throws (catch branch)', () => {
    it('silently ignores errors from sessionStorage.setItem', () => {
      vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      // Must not throw
      expect(() => markTypewriterComplete('any-key')).not.toThrow();
    });
  });
});
