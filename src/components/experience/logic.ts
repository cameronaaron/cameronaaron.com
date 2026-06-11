import { getDateSortKey, sortByDateDesc } from '@/data/dateOrdering';
import type { Experience } from '@/data/experience';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

export interface ExperienceTimelineItem extends Experience {
  latestPeriod: string;
}

export const EXPERIENCE_FLOW_PHASES = [
  'Clinical operations',
  'Research translation',
  'Security and systems',
] as const;

export function getExperienceMotionConfig(performanceTier: PerformanceTier) {
  const isLiteMotion = performanceTier === 'lite' || performanceTier === 'reduced';

  return {
    isLiteMotion,
    isCinematic: performanceTier === 'full',
    entryYOffset: isLiteMotion ? 10 : 22,
    timelineTravel: isLiteMotion ? 16 : 32,
    timelineStagger: isLiteMotion ? 0.04 : 0.1,
  };
}

export function sortExperiencesForTimeline(items: Experience[]): ExperienceTimelineItem[] {
  return [...items]
    .map((experience) => {
      const sortedPositions = sortByDateDesc(experience.positions, (position) => position.period);
      const latestPeriod = sortedPositions[0]?.period ?? '';

      return {
        ...experience,
        positions: sortedPositions,
        latestPeriod,
      };
    })
    .sort((left, right) => getDateSortKey(right.latestPeriod) - getDateSortKey(left.latestPeriod));
}

export function getExperienceItemId(index: number): string {
  return `experience-item-${index}`;
}

export function getTimelineDotAnimation(isLiteMotion: boolean, isActive: boolean) {
  if (isActive) {
    return {
      scale: 1.35,
      backgroundColor: 'rgb(34 211 238)',
      boxShadow: isLiteMotion ? '0 0 10px rgba(34, 211, 238, 0.55)' : '0 0 16px rgba(34, 211, 238, 0.85)',
    };
  }
  return {
    scale: 1,
    backgroundColor: 'rgb(16 185 129)',
    boxShadow: isLiteMotion ? '0 0 6px rgba(16, 185, 129, 0.35)' : '0 0 10px rgba(16, 185, 129, 0.5)',
  };
}

export function getTimelineDotTransition(isLiteMotion: boolean) {
  if (isLiteMotion) {
    return { duration: 0.2, ease: 'easeOut' as const };
  }
  return { type: 'spring' as const, stiffness: 280, damping: 22 };
}
