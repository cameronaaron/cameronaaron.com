import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readInitialReveal, splitRevealWords } from '@/components/ui/text-reveal-logic';

describe('text-reveal-logic coverage', () => {
  describe('readInitialReveal — window undefined branch', () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      originalWindow = globalThis.window;
    });

    afterEach(() => {
      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    it('returns false when window is undefined (SSR environment)', () => {
      // Simulate server-side rendering where window is not defined
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(readInitialReveal('any-key')).toBe(false);
    });
  });

  describe('readInitialReveal — navigation type branches', () => {
    beforeEach(() => {
      // Ensure sessionStorage does not have '1' for the key used in these tests
      window.sessionStorage.removeItem('nav-test-key');
    });

    afterEach(() => {
      vi.restoreAllMocks();
      window.sessionStorage.removeItem('nav-test-key');
    });

    it('returns false when nav entries are empty (no navigation entry)', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
      expect(readInitialReveal('nav-test-key')).toBe(false);
    });

    it('returns false when navigation type is "navigate" (not back_forward)', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'navigate' } as unknown as PerformanceEntry,
      ]);
      expect(readInitialReveal('nav-test-key')).toBe(false);
    });

    it('returns false when navigation type is "reload"', () => {
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { type: 'reload' } as unknown as PerformanceEntry,
      ]);
      expect(readInitialReveal('nav-test-key')).toBe(false);
    });
  });

  describe('splitRevealWords', () => {
    it('returns an array with a single element for a single word', () => {
      expect(splitRevealWords('Hello')).toEqual(['Hello']);
    });

    it('returns an empty string element for empty string input', () => {
      expect(splitRevealWords('')).toEqual(['']);
    });
  });
});
