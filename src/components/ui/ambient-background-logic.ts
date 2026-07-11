import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

export interface OrbSpec {
  className: string;
  animate: {
    x: number[];
    y: number[];
    scale: number[];
  };
  transition: {
    duration: number;
    repeat: number;
    ease: 'easeInOut';
    delay?: number;
  };
}

export const AMBIENT_ORBS: OrbSpec[] = [
  {
    className: 'absolute top-0 left-1/4 h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl',
    animate: { x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] },
    transition: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    className: 'absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-3xl',
    animate: { x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.3, 1] },
    transition: { duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 },
  },
  {
    className: 'absolute bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-teal-500/20 blur-3xl',
    animate: { x: [0, 60, 0], y: [0, -80, 0], scale: [1, 1.15, 1] },
    transition: { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 },
  },
  {
    className: 'absolute top-2/3 right-1/3 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl',
    animate: { x: [0, -50, 0], y: [0, 70, 0], scale: [1, 1.25, 1] },
    transition: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 },
  },
  {
    className: 'absolute top-1/2 left-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/15 blur-3xl',
    animate: { x: [0, -120, 0], y: [0, -100, 0], scale: [1, 1.4, 1] },
    transition: { duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 3 },
  },
  {
    className: 'absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-emerald-400/15 blur-3xl',
    animate: { x: [0, 90, 0], y: [0, -60, 0], scale: [1, 1.35, 1] },
    transition: { duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 5 },
  },
  {
    className: 'absolute top-1/4 left-0 h-[350px] w-[350px] rounded-full bg-blue-500/18 blur-3xl',
    animate: { x: [0, 70, 0], y: [0, 90, 0], scale: [1, 1.28, 1] },
    transition: { duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 6 },
  },
];

export const ORB_COUNT_BY_TIER: Record<PerformanceTier, number> = {
  full: AMBIENT_ORBS.length,
  balanced: 4,
  lite: 2,
  reduced: 1,
};

// Sliced once at module load — each render is a single O(1) table lookup with
// zero allocation, instead of re-slicing AMBIENT_ORBS on every tier change.
const VISIBLE_ORBS_BY_TIER: Record<PerformanceTier, readonly OrbSpec[]> = {
  full: AMBIENT_ORBS,
  balanced: AMBIENT_ORBS.slice(0, ORB_COUNT_BY_TIER.balanced),
  lite: AMBIENT_ORBS.slice(0, ORB_COUNT_BY_TIER.lite),
  reduced: AMBIENT_ORBS.slice(0, ORB_COUNT_BY_TIER.reduced),
};

export function getVisibleAmbientOrbs(performanceTier: PerformanceTier): readonly OrbSpec[] {
  return VISIBLE_ORBS_BY_TIER[performanceTier];
}

export function shouldAnimateOrbs(performanceTier: PerformanceTier): boolean {
  return performanceTier === 'full';
}
