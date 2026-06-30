import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

export function getAmbientOrbCount(performanceTier: PerformanceTier, totalOrbs: number): number {
  if (performanceTier === 'full') return totalOrbs;
  if (performanceTier === 'balanced') return 4;
  if (performanceTier === 'lite') return 2;
  return 1;
}

export function shouldAnimateOrbs(performanceTier: PerformanceTier): boolean {
  return performanceTier === 'full';
}
