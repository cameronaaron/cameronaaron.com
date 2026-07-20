'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { isEditableTarget } from '@/components/ui/keyboard-shortcuts-logic';
import {
  AURORA_SURGE_EVENT,
  SURGE_DURATION_MS,
  advanceKonamiIndex,
  isKonamiComplete,
} from '@/components/ui/aurora-surge-logic';

/**
 * Konami-code easter egg: ↑ ↑ ↓ ↓ ← → ← → B A unlocks a one-shot full-screen
 * aurora surge and broadcasts AURORA_SURGE_EVENT so CursorComet throws a spark
 * storm. Every animation here is finite — the overlay unmounts after
 * SURGE_DURATION_MS. Parent gates to the full tier (it's keyboard-driven).
 */
export default function AuroraSurge() {
  const [active, setActive] = useState(false);
  const sequenceIndexRef = useRef(0);
  const timerRef = useRef(0);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const nextIndex = advanceKonamiIndex(sequenceIndexRef.current, event.key);
      sequenceIndexRef.current = nextIndex;
      if (!isKonamiComplete(nextIndex)) return;

      sequenceIndexRef.current = 0;
      window.dispatchEvent(new CustomEvent(AURORA_SURGE_EVENT));
      setActive(true);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setActive(false), SURGE_DURATION_MS);
    };

    window.addEventListener('keydown', handleKeydown, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {active ? (
        <m.div
          className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeOut' } }}
          aria-hidden="true"
          data-testid="aurora-surge-overlay"
        >
          <m.div
            className="absolute inset-[-40%]"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(12, 189, 242, 0.22), rgba(16, 212, 146, 0.16), rgba(129, 140, 248, 0.2), rgba(12, 189, 242, 0.22))',
              filter: 'blur(60px)',
            }}
            initial={{ rotate: 0, scale: 0.72, opacity: 0 }}
            animate={{ rotate: 180, scale: 1.12, opacity: 1 }}
            transition={{ duration: SURGE_DURATION_MS / 1000, ease: 'easeInOut' }}
          />

          {[0, 1, 2].map((ring) => (
            <m.span
              key={ring}
              className="absolute h-60 w-60 rounded-full border border-cyan-300/40"
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 5 + ring * 1.5, opacity: 0 }}
              transition={{ duration: 1.6, delay: ring * 0.25, ease: 'easeOut' }}
            />
          ))}

          <m.span
            className="font-mono-accent relative text-xs font-medium uppercase tracking-[0.4em] text-cyan-100 sm:text-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: [0, 1, 1, 0], y: 0 }}
            transition={{ duration: SURGE_DURATION_MS / 1000, times: [0, 0.15, 0.75, 1] }}
          >
            Aurora surge unlocked
          </m.span>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
