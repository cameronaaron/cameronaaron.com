'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = 'manual';

    const lenis = new Lenis({
      duration: 1.2,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId = 0;

    const syncScrollState = () => {
      if (window.location.hash) {
        return;
      }

      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (navigationEntry?.type === 'reload' || navigationEntry?.type === 'back_forward') {
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

    const handlePageShow = (event: PageTransitionEvent) => {
      if (typeof lenis.resize === 'function') {
        lenis.resize();
      }

      if (event.persisted) {
        syncScrollState();
        window.setTimeout(syncScrollState, 0);
        return;
      }

      syncScrollState();
      window.setTimeout(syncScrollState, 0);
    };

    syncScrollState();
    window.setTimeout(syncScrollState, 0);

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pageshow', handlePageShow);
      lenis.destroy();

      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
}
