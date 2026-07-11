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

    it(`ScrollIndicator bounce is ${mode}`, async () => {
      mockInteractionMode(prefersReducedMotion);
      const { default: ScrollIndicator } = await import('../hero/ScrollIndicator');
      const { container } = render(<ScrollIndicator />);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it(`FloatingBadge float/rotate is ${mode}`, async () => {
      mockInteractionMode(prefersReducedMotion);
      const { default: FloatingBadge } = await import('./FloatingBadge');
      const { container } = render(<FloatingBadge icon="innovation" position="top-right" />);
      expect(container.firstChild).toBeTruthy();
    });

    it(`SectionReveal and SectionHandoff glows are ${mode}`, async () => {
      mockInteractionMode(prefersReducedMotion);
      const { SectionReveal, SectionHandoff } = await import('./SectionTransitions');
      const { getByText } = render(
        <>
          <SectionReveal index={1}>
            <p>Section body</p>
          </SectionReveal>
          <SectionHandoff label="Next up" index={1} cue="Keep scrolling" targetId="skills" />
        </>
      );
      expect(getByText('Section body')).toBeTruthy();
      expect(getByText('Next up')).toBeTruthy();
      expect(getByText('Keep scrolling')).toBeTruthy();
    });
  }
});
