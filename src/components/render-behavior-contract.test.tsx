/**
 * Render-behavior contract.
 *
 * The algorithm-and-datastructure contract asserts that source code LOOKS
 * right; this file asserts that it BEHAVES right, using React's Profiler and
 * real event storms. String checks can be fooled by comments or renames —
 * a commit count cannot.
 *
 * Properties enforced:
 *   1. SpotlightCard — a mousemove storm causes ZERO child re-renders
 *      (position flows through CSS custom properties, not React state).
 *   2. InteractiveParticles — animation frames cause ZERO React commits
 *      (the simulation renders to canvas, never through reconciliation).
 *   3. Navigation — a scroll storm coalesces into at most ONE commit
 *      (rAF-deduped handler + functional-updater bail-out).
 *   4. BackToTop — scroll events that don't cross the threshold commit nothing.
 */

import React, { Profiler } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SpotlightCard from './ui/SpotlightCard';
import InteractiveParticles from './hero/InteractiveParticles';
import Navigation from './Navigation';
import BackToTop from './ui/BackToTop';
import { navItems } from '@/data/navigation';

function withRafQueue(testBody: (callbacks: FrameRequestCallback[]) => void) {
  const originalRaf = window.requestAnimationFrame;
  const originalGlobalRaf = globalThis.requestAnimationFrame;
  const callbacks: FrameRequestCallback[] = [];
  const queuedRaf = vi.fn((cb: FrameRequestCallback) => {
    callbacks.push(cb);
    return callbacks.length;
  });

  Object.defineProperty(window, 'requestAnimationFrame', { writable: true, value: queuedRaf });
  Object.defineProperty(globalThis, 'requestAnimationFrame', { writable: true, value: queuedRaf });

  try {
    testBody(callbacks);
  } finally {
    Object.defineProperty(window, 'requestAnimationFrame', { writable: true, value: originalRaf });
    Object.defineProperty(globalThis, 'requestAnimationFrame', { writable: true, value: originalGlobalRaf });
  }
}

describe('SpotlightCard — mousemove storm causes zero child re-renders', () => {
  it('keeps children unrendered across 50 mousemoves while updating CSS variables', () => {
    let childRenders = 0;
    function CountingChild() {
      childRenders += 1;
      return <div data-testid="spot-child">child</div>;
    }

    const { container } = render(
      <SpotlightCard>
        <CountingChild />
      </SpotlightCard>
    );
    const card = container.firstElementChild as HTMLElement;

    // Hover enter is allowed to commit once (border/opacity state).
    fireEvent.mouseEnter(card);
    const rendersAfterEnter = childRenders;

    for (let i = 0; i < 50; i += 1) {
      fireEvent.mouseMove(card, { clientX: 10 + i, clientY: 20 + i });
    }

    expect(childRenders).toBe(rendersAfterEnter);

    // The position still tracked every move — through the style system, not React.
    const spotlight = Array.from(card.querySelectorAll('div')).find((el) =>
      el.style.background.includes('var(--spotlight-x')
    )!;
    expect(spotlight.style.getPropertyValue('--spotlight-x')).toBe('59px');
    expect(spotlight.style.getPropertyValue('--spotlight-y')).toBe('69px');
  });
});

describe('InteractiveParticles — animation causes zero React commits', () => {
  it('runs pointer + burst + draw frames without a single reconciliation', () => {
    withRafQueue((callbacks) => {
      const commits: number[] = [];

      render(
        <Profiler id="interactive-particles" onRender={() => commits.push(commits.length)}>
          <InteractiveParticles quality="full" />
        </Profiler>
      );
      const mountCommits = commits.length;

      fireEvent.mouseMove(window, { clientX: 200, clientY: 150 });
      fireEvent.mouseDown(window, { clientX: 200, clientY: 150 });

      for (let i = 0; i < 12; i += 1) {
        act(() => {
          callbacks[i]?.(10 + i * 20);
        });
      }
      fireEvent.mouseOut(window);
      act(() => {
        callbacks[12]?.(400);
      });

      expect(commits.length).toBe(mountCommits);
    });
  });
});

describe('Navigation — scroll storm coalesces into at most one commit', () => {
  it('20 scroll events schedule one frame and commit at most once on flush', () => {
    withRafQueue((callbacks) => {
      for (const item of navItems) {
        const section = document.createElement('section');
        section.id = item.href.replace('#', '');
        document.body.appendChild(section);
      }

      try {
        const commits: number[] = [];
        render(
          <Profiler id="navigation" onRender={() => commits.push(commits.length)}>
            <Navigation />
          </Profiler>
        );
        const mountCommits = commits.length;
        const framesAfterMount = callbacks.length;

        act(() => {
          for (let i = 0; i < 20; i += 1) {
            fireEvent.scroll(window);
          }
        });

        // The storm itself commits nothing and schedules exactly one frame.
        expect(commits.length).toBe(mountCommits);
        expect(callbacks.length).toBe(framesAfterMount + 1);

        act(() => {
          callbacks[framesAfterMount]?.(16);
        });

        // Flushing recomputes the active section: at most one commit.
        expect(commits.length - mountCommits).toBeLessThanOrEqual(1);
      } finally {
        document.body.innerHTML = '';
      }
    });
  });
});

describe('BackToTop — sub-threshold scrolling commits nothing', () => {
  it('30 scroll events below the threshold cause zero commits', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });

    const commits: number[] = [];
    render(
      <Profiler id="back-to-top" onRender={() => commits.push(commits.length)}>
        <BackToTop />
      </Profiler>
    );
    const mountCommits = commits.length;

    act(() => {
      for (let i = 0; i < 30; i += 1) {
        fireEvent.scroll(window);
      }
    });

    expect(commits.length).toBe(mountCommits);
    expect(screen.queryByTestId('back-to-top')).toBeNull();
  });
});
