import { describe, expect, it, vi } from 'vitest';
import { readInitialReveal, splitRevealWords } from '@/components/ui/text-reveal-logic';

describe('text reveal logic', () => {
  it('splits words for staggered reveal rendering', () => {
    expect(splitRevealWords('Nursing Path Ahead')).toEqual(['Nursing', 'Path', 'Ahead']);
  });

  it('reads initial reveal state from session storage', () => {
    window.sessionStorage.setItem('reveal-key', '1');
    expect(readInitialReveal('reveal-key')).toBe(true);
  });

  it('reads initial reveal state from bfcache navigation type', () => {
    const original = performance.getEntriesByType.bind(performance);
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((name: string) => {
      if (name === 'navigation') {
        return [{ type: 'back_forward' } as unknown as PerformanceEntry];
      }
      return original(name);
    });

    expect(readInitialReveal('missing-key')).toBe(true);
  });
});
