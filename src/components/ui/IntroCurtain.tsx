'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useLayoutEffect, useState } from 'react';

interface IntroCurtainProps {
  /** Time (ms) before the curtain begins exiting. */
  holdMs?: number;
}

const STORAGE_KEY = 'intro-curtain-shown';

// SSR-safe layout effect: useLayoutEffect on client, no-op on server.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function shouldSkipInitialCurtain(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY) === '1') return true;
  } catch {
    // sessionStorage may be unavailable (private mode, etc.) — fall through.
  }
  try {
    const nav = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav[0]?.type === 'back_forward') return true;
  } catch {
    // ignore
  }
  return false;
}

export default function IntroCurtain({ holdMs = 520 }: IntroCurtainProps = {}) {
  const prefersReducedMotion = useReducedMotion();
  // Initial state MUST match SSR (true) — collapsed synchronously below if skipping.
  const [visible, setVisible] = useState(true);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion || shouldSkipInitialCurtain()) {
      setVisible(false);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!visible) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // ignore
      }
      return;
    }
    const timer = window.setTimeout(() => {
      setVisible(false);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // ignore
      }
    }, holdMs);
    return () => window.clearTimeout(timer);
  }, [holdMs, visible]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setVisible(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="intro-curtain"
          data-testid="intro-curtain"
          role="presentation"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
        >
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.22),transparent_55%),radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.18),transparent_60%)]"
            initial={{ opacity: 0.3, scale: 1.1 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-x-0 top-1/2 mx-auto h-px w-2/3 max-w-3xl -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent"
            initial={{ scaleX: 0.1, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 1.1, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.span
            className="relative z-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-cyan-100/90"
            initial={{ opacity: 0, y: 8, letterSpacing: '0.15em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.4em' }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Cameron Aaron
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </motion.span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
