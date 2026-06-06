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
