'use client';

import { usePerformanceProfile } from './usePerformanceProfile';

export function useInteractionMode() {
  const { prefersReducedMotion, isCoarsePointer } = usePerformanceProfile();

  return {
    prefersReducedMotion,
    isCoarsePointer,
    enableHoverMotion: !prefersReducedMotion && !isCoarsePointer,
  };
}
