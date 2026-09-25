'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { resolveHashElementId, shouldResetScrollPosition } from './smooth-scroll-logic';
import { setActiveLenis } from './lenis-registry';
import { cancelSectionScroll, scrollToSection } from './scroll-to-section';

export default function SmoothScroll() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = 'manual';

    // Same-page anchor clicks (Navigation, footer, Hero CTAs, QuickActionsDock)
    // on every tier: the browser — or Lenis's `anchors` option below — starts
    // the scroll and keeps native hash/focus semantics, and scrollToSection
    // follows it, re-aiming as `.cv-section` placeholders resolve and push the
    // target down. Without the follow-up, a nav click to #contact stopped
    // ~11,700px short.
    const handleAnchorClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      const elementId = anchor ? resolveHashElementId(anchor.getAttribute('href') ?? '') : null;
      const target = elementId ? document.getElementById(elementId) : null;
      if (!target) return;
      scrollToSection(target, {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        issueInitialScroll: false,
      });
    };
    document.addEventListener('click', handleAnchorClick);
    const detachAnchorFollow = () => {
      document.removeEventListener('click', handleAnchorClick);
      cancelSectionScroll();
    };

    // Touch devices have native momentum scrolling — Lenis fights it and causes lag
    if (window.matchMedia('(pointer: coarse)').matches) {
      return () => {
        detachAnchorFollow();
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
      detachAnchorFollow();
      setActiveLenis(null);
      lenis.destroy();

      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
}
