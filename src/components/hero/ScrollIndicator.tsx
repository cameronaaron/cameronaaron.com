'use client';

import { m } from 'framer-motion';

import { useInteractionMode } from '@/hooks/useInteractionMode';

export default function ScrollIndicator() {
  const { prefersReducedMotion } = useInteractionMode();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
    >
      <m.div
        animate={prefersReducedMotion ? undefined : { y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-white/50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </m.div>
    </m.div>
  );
}
