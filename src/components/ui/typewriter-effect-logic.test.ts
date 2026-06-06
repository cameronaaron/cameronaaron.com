import { describe, expect, it, vi } from 'vitest';
import {
  getTypewriterStorageKey,
  markTypewriterComplete,
  readInitialComplete,
} from '@/components/ui/typewriter-effect-logic';

describe('typewriter effect logic', () => {
  it('builds deterministic storage keys', () => {
    expect(getTypewriterStorageKey('Hello')).toBe('typewriter-complete:Hello');
  });

  it('reads completion state from session storage', () => {
    const key = getTypewriterStorageKey('Saved');
    window.sessionStorage.setItem(key, '1');
    expect(readInitialComplete(key)).toBe(true);
  });

  it('reads completion state from back-forward navigation', () => {
    const original = performance.getEntriesByType.bind(performance);
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((name: string) => {
      if (name === 'navigation') {
        return [{ type: 'back_forward' } as unknown as PerformanceEntry];
      }
      return original(name);
    });

    expect(readInitialComplete('missing-key')).toBe(true);
  });

  it('marks completion state in session storage', () => {
    markTypewriterComplete('complete-key');
    expect(window.sessionStorage.getItem('complete-key')).toBe('1');
  });
});
