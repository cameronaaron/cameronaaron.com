'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { resolveHashElementId, shouldResetScrollPosition } from './smooth-scroll-logic';
import { setActiveLenis } from './lenis-registry';

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
      // Intercepts clicks on same-page `a[href="#section"]` links (Navigation,
      // Hero CTAs, QuickActionsDock) and drives the scroll through Lenis
      // itself. Without this, the browser's native (CSS scroll-behavior:
      // smooth) anchor jump gets fought and cancelled frame-by-frame by
      // Lenis's own raf loop re-asserting its stale scroll position — the
      // page never actually reaches the target section.
      anchors: true,
    });

    setActiveLenis(lenis);

    let rafId = 0;
    let syncTimeoutId = 0;

    const syncScrollState = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (shouldResetScrollPosition(window.location.hash, navigationEntry?.type)) {
        window.scrollTo(0, 0);

        if (typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(0, { immediate: true });
        }
        return;
      }

      // A fresh load or reload landing on a hash URL: same fight as anchor
      // clicks above, except there's no click event for `anchors` to
      // intercept — Lenis's raf loop must be told explicitly where to land.
      const elementId = resolveHashElementId(window.location.hash);
      const target = elementId ? document.getElementById(elementId) : null;
      if (target && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(target, { immediate: true });
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
      setActiveLenis(null);
      lenis.destroy();

      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
}
