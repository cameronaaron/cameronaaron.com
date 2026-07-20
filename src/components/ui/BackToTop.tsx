'use client';

import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BackToTopProps {
  /** Pixel scroll distance after which the button appears. */
  threshold?: number;
}

export default function BackToTop({ threshold = 600 }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const evaluate = () => setVisible(window.scrollY > threshold);
    evaluate();
    window.addEventListener('scroll', evaluate, { passive: true });
    return () => window.removeEventListener('scroll', evaluate);
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <m.button
          key="back-to-top"
          type="button"
          onClick={handleClick}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="pointer-events-auto fixed bottom-20 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/40 bg-black/70 text-cyan-100 shadow-lg shadow-cyan-500/20 backdrop-blur-md transition-colors hover:border-cyan-300/70 hover:text-white sm:bottom-24 sm:right-6"
          aria-label="Scroll to top of page"
          data-testid="back-to-top"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <polyline points="6 15 12 9 18 15" />
          </svg>
        </m.button>
      ) : null}
    </AnimatePresence>
  );
}
