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

/** The four entry points use existing portfolio sections, not a second content tree. */
export const HERO_WORLDS = [
  { title: 'Ideas into interfaces.', description: 'Software engineering shaped by curiosity, clarity, and the people using it.', href: '#experience', action: 'Explore my experience', word: 'Build', tone: 'ice' },
  { title: 'Curiosity with a purpose.', description: 'Security research and a habit of asking how things work — and how they could work better.', href: '#projects', action: 'Explore the research', word: 'Question', tone: 'violet' },
  { title: 'People at the center.', description: 'Emergency care, aerospace medicine, and clinical experience grounded in human connection.', href: '#certifications', action: 'View clinical credentials', word: 'Care', tone: 'mint' },
  { title: 'Always becoming.', description: 'Building on a foundation in healthcare and education while preparing for Nurse Practitioner training.', href: '#education', action: 'Follow the learning journey', word: 'Grow', tone: 'amber' },
] as const;

export function getNextHeroWorld(current: number, key: string): number {
  if (key === 'Home') return 0;
  if (key === 'End') return HERO_WORLDS.length - 1;
  if (key === 'ArrowRight') return (current + 1) % HERO_WORLDS.length;
  if (key === 'ArrowLeft') return (current + HERO_WORLDS.length - 1) % HERO_WORLDS.length;
  return current;
}
