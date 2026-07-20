import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

export interface HeroMotionConfig {
  shouldUseParallax: boolean;
  showFloatingBadges: boolean;
  parallaxDepth: number;
  scaleFloor: number;
}

export interface HeroFloatingBadge {
  label: string;
  className: string;
}

export const HERO_SIGNAL_CHIPS = ['Engineering', 'Security', 'Clinical Care', 'NP Path'] as const;

export const HERO_FLOATING_BADGES: HeroFloatingBadge[] = [
  { label: 'EMT', className: '-left-4 top-10' },
  { label: 'Security', className: 'right-1 top-3' },
  { label: 'Research', className: '-right-8 bottom-24' },
  { label: 'Future NP', className: 'left-2 -bottom-4' },
];

export function getHeroMotionConfig(performanceTier: PerformanceTier): HeroMotionConfig {
  const shouldUseParallax = performanceTier === 'full';

  return {
    shouldUseParallax,
    showFloatingBadges: performanceTier === 'full',
    parallaxDepth: performanceTier === 'full' ? 150 : performanceTier === 'balanced' ? 100 : 45,
    scaleFloor: performanceTier === 'full' ? 0.8 : performanceTier === 'balanced' ? 0.88 : 0.94,
  };
}
