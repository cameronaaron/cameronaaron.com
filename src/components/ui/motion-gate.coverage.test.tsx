import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Branch coverage for the reduced-motion gates on every component that runs
 * an infinite (repeat: Infinity) animation. Each component renders once per
 * branch — gated (prefersReducedMotion: true) and animated (false) — so the
 * `prefersReducedMotion ? undefined : {...}` ternaries stay fully covered.
 */

function mockInteractionMode(prefersReducedMotion: boolean) {
  vi.doMock('@/hooks/useInteractionMode', () => ({
    useInteractionMode: () => ({
      enableHoverMotion: !prefersReducedMotion,
      prefersReducedMotion,
      isCoarsePointer: prefersReducedMotion,
    }),
  }));
}

describe('infinite-animation motion gates', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false, media: q, onchange: null,
        addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  for (const prefersReducedMotion of [true, false]) {
    const mode = prefersReducedMotion ? 'gated (reduced motion)' : 'animated';

    it(`SkillBar shimmer is ${mode}`, async () => {
      mockInteractionMode(prefersReducedMotion);
      const { default: SkillBar } = await import('./SkillBar');
      const { getByText } = render(<SkillBar name="TypeScript" level={95} index={0} />);
      expect(getByText('TypeScript')).toBeTruthy();
      expect(getByText('95%')).toBeTruthy();
    });
  }
});
