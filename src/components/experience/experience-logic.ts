import { sortByDateDesc } from '@/data/dateOrdering';
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
  const timelineItems = items.map((experience) => {
    const sortedPositions = sortByDateDesc(experience.positions, (position) => position.period);
    const latestPeriod = sortedPositions[0]?.period ?? '';

    return {
      ...experience,
      positions: sortedPositions,
      latestPeriod,
    };
  });

  // sortByDateDesc parses each latestPeriod once (decorate-sort-undecorate);
  // a bare .sort() comparator would re-parse on every comparison.
  return sortByDateDesc(timelineItems, (item) => item.latestPeriod);
}

export function getExperienceItemId(index: number): string {
  return `experience-item-${index}`;
}

export function getTimelineDotAnimation(isLiteMotion: boolean, isActive: boolean) {
  if (isActive) {
    return {
      scale: 1.35,
      backgroundColor: 'rgb(34 211 238)',
      boxShadow: isLiteMotion ? '0 0 10px rgba(56, 214, 255, 0.55)' : '0 0 16px rgba(56, 214, 255, 0.85)',
    };
  }
  return {
    scale: 1,
    backgroundColor: 'rgb(16 185 129)',
    boxShadow: isLiteMotion ? '0 0 6px rgba(16, 212, 146, 0.35)' : '0 0 10px rgba(16, 212, 146, 0.5)',
  };
}

/**
 * A spring computes color/shadow samples through an interpolation path that
 * can serialize to oklab() mid-transition — some browsers reject setting
 * that via inline style ("not an animatable color",
 * motion.dev/troubleshooting/color-not-animatable). Scale keeps a spring for
 * the springy feel; backgroundColor/boxShadow always use a plain tween,
 * which only ever interpolates within the source rgba() space.
 */
const TIMELINE_DOT_COLOR_TRANSITION = { type: 'tween' as const, duration: 0.2, ease: 'easeOut' as const };

export function getTimelineDotTransition(isLiteMotion: boolean) {
  return {
    scale: isLiteMotion
      ? TIMELINE_DOT_COLOR_TRANSITION
      : { type: 'spring' as const, stiffness: 280, damping: 22 },
    backgroundColor: TIMELINE_DOT_COLOR_TRANSITION,
    boxShadow: TIMELINE_DOT_COLOR_TRANSITION,
  };
}

export function getExperiencePhaseStaggerDelay(index: number, isLiteMotion: boolean): number {
  return index * (isLiteMotion ? 0.04 : 0.1);
}

export function getExperienceNavStaggerDelay(index: number, isLiteMotion: boolean): number {
  return index * (isLiteMotion ? 0.02 : 0.05);
}

export function getExperienceItemX(
  index: number,
  isLiteMotion: boolean,
  timelineTravel: number
): number {
  return isLiteMotion ? 0 : index % 2 === 0 ? -timelineTravel : timelineTravel;
}
