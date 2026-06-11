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
