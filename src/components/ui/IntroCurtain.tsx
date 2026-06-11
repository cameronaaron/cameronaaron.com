'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  INTRO_CURTAIN_STORAGE_KEY,
  markIntroCurtainShown,
  shouldSkipInitialCurtain,
} from '@/components/ui/intro-curtain-logic';

interface IntroCurtainProps {
  /** Time (ms) before the curtain begins exiting. */
  holdMs?: number;
}

// SSR-safe layout effect: useLayoutEffect on client, no-op on server.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function IntroCurtain({ holdMs = 600 }: IntroCurtainProps = {}) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = Boolean(prefersReducedMotion);
  // Initial state MUST match SSR (true) — collapsed synchronously below if skipping.
  const [visible, setVisible] = useState(true);

  useIsomorphicLayoutEffect(() => {
    if (shouldSkipInitialCurtain()) {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      markIntroCurtainShown(INTRO_CURTAIN_STORAGE_KEY);
      return;
    }
    const effectiveHoldMs = reducedMotion ? Math.min(holdMs, 220) : holdMs;
    const timer = window.setTimeout(() => {
      setVisible(false);
      markIntroCurtainShown(INTRO_CURTAIN_STORAGE_KEY);
    }, effectiveHoldMs);
    return () => window.clearTimeout(timer);
  }, [holdMs, reducedMotion, visible]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setVisible(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const exitDuration = reducedMotion ? 0 : 0.65;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="intro-curtain"
          data-testid="intro-curtain"
          role="presentation"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: exitDuration,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
        >
          {/* Radial glow */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.18) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)',
            }}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {/* Top sweep line */}
          <motion.div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />

          {/* Bottom sweep line */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: 'easeOut' }}
          />

          {/* Center horizontal rule */}
          <motion.div
            className="absolute inset-x-0 top-1/2 mx-auto h-px w-3/4 max-w-2xl -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"
            initial={{ scaleX: 0.05, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Name lockup */}
          <div className="relative z-10 flex flex-col items-center gap-3 select-none">
            <motion.span
              className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.5em] text-cyan-100/80"
              initial={{ opacity: 0, y: 10, letterSpacing: '0.15em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.5em' }}
              exit={{ opacity: 0, y: -8, letterSpacing: '0.6em' }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                animate={reducedMotion ? {} : { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              Cameron Aaron
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={reducedMotion ? {} : { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.span>

            <motion.p
              className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground/60"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.45, delay: 0.22, ease: 'easeOut' }}
            >
              EMT · Software Engineer · Security Researcher
            </motion.p>
          </div>

          {/* Corner accents */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner, i) => (
            <motion.div
              key={corner}
              className={`absolute h-8 w-8 ${
                corner === 'tl' ? 'top-6 left-6 border-l border-t' :
                corner === 'tr' ? 'top-6 right-6 border-r border-t' :
                corner === 'bl' ? 'bottom-6 left-6 border-l border-b' :
                'bottom-6 right-6 border-r border-b'
              } border-white/15`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.4, delay: 0.08 + i * 0.04, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
