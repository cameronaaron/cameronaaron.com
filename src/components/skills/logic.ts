import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

export type TechnicalView = 'priority' | 'alphabetical';

export interface TechnicalSkill {
  name: string;
  level: number;
}

export interface SkillsMotionConfig {
  isLiteMotion: boolean;
  isCinematic: boolean;
  entryYOffset: number;
  parallaxRange: [number, number];
  staggerDelay: number;
}

export const SKILLS_JOURNEY_PHASES = ['Assess', 'Apply', 'Validate'] as const;
export type SkillsJourneyPhase = (typeof SKILLS_JOURNEY_PHASES)[number];

export function sortTechnicalSkills(skills: TechnicalSkill[], view: TechnicalView): TechnicalSkill[] {
  if (view === 'alphabetical') {
    return [...skills].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...skills].sort((a, b) => b.level - a.level);
}

export function getStrongestSkill(skills: TechnicalSkill[]): TechnicalSkill | undefined {
  return skills[0];
}

export function getSkillsMotionConfig(performanceTier: PerformanceTier): SkillsMotionConfig {
  const isLiteMotion = performanceTier === 'lite' || performanceTier === 'reduced';
  return {
    isLiteMotion,
    isCinematic: performanceTier === 'full',
    entryYOffset: isLiteMotion ? 10 : 20,
    parallaxRange: isLiteMotion ? [36, -36] : [100, -100],
    staggerDelay: isLiteMotion ? 0.06 : 0.14,
  };
}

export function getSkillBarEntryTransition(isLiteMotion: boolean, index: number) {
  const delay = index * (isLiteMotion ? 0.015 : 0.04);
  if (isLiteMotion) {
    return { delay, duration: 0.26, ease: 'easeOut' as const };
  }
  return { type: 'spring' as const, delay, duration: 0.42, stiffness: 280, damping: 24 };
}

export function getSkillColumnVariants(isLiteMotion: boolean, direction: 'left' | 'right', entryYOffset: number) {
  const x = isLiteMotion ? 0 : direction === 'left' ? -36 : 36;
  return {
    hidden: { opacity: 0, x, y: entryYOffset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: isLiteMotion ? 0.42 : 0.62, ease: 'easeOut' as const },
    },
  };
}

export function getDomainCardHoverTransition(isLiteMotion: boolean) {
  if (isLiteMotion) {
    return { type: 'tween' as const, duration: 0.2 };
  }
  return { type: 'spring' as const, stiffness: 400, damping: 15 };
}
