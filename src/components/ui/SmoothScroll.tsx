'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { shouldResetScrollPosition } from './smooth-scroll-logic';

export default function SmoothScroll() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = 'manual';

    // Touch devices have native momentum scrolling — Lenis fights it and causes lag
    if (window.matchMedia('(pointer: coarse)').matches) {
      return () => {
        window.history.scrollRestoration = previousScrollRestoration;
      };
    }

    const lenis = new Lenis({
      duration: 1.2,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId = 0;
    let syncTimeoutId = 0;

    const syncScrollState = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (shouldResetScrollPosition(window.location.hash, navigationEntry?.type)) {
        window.scrollTo(0, 0);

        if (typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(0, { immediate: true });
        }
      }
    };

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // The zero-delay re-sync catches browsers that restore scroll position
    // after the pageshow handlers run. Tracked so unmount can cancel it —
    // a late callback would call scrollTo on a destroyed Lenis instance.
    const queueSyncScrollState = () => {
      window.clearTimeout(syncTimeoutId);
      syncTimeoutId = window.setTimeout(syncScrollState, 0);
    };

    const handlePageShow = () => {
      if (typeof lenis.resize === 'function') {
        lenis.resize();
      }

      syncScrollState();
      queueSyncScrollState();
    };

    syncScrollState();
    queueSyncScrollState();

    window.addEventListener('pageshow', handlePageShow, { passive: true });

    return () => {
      window.clearTimeout(syncTimeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener('pageshow', handlePageShow);
      lenis.destroy();

      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
}
