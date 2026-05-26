'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function useInteractionMode() {
  const prefersReducedMotion = useReducedMotion();
  const [isCoarsePointer, setIsCoarsePointer] = useState(() => {
    /* v8 ignore next */
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');

    const handleChange = (event: MediaQueryListEvent) => {
      setIsCoarsePointer(event.matches);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return {
    prefersReducedMotion,
    isCoarsePointer,
    enableHoverMotion: !prefersReducedMotion && !isCoarsePointer,
  };
}
