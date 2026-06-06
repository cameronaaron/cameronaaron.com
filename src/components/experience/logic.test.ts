import { describe, expect, it } from 'vitest';
import { experiences } from '@/data/experience';
import {
  EXPERIENCE_FLOW_PHASES,
  getExperienceItemId,
  getExperienceMotionConfig,
  sortExperiencesForTimeline,
} from '@/components/experience/logic';

describe('experience logic', () => {
  it('exposes stable phase labels for the timeline chips', () => {
    expect(EXPERIENCE_FLOW_PHASES).toEqual([
      'Clinical operations',
      'Research translation',
      'Security and systems',
    ]);
  });

  it('sorts experiences and nested positions by most recent period', () => {
    const sorted = sortExperiencesForTimeline(experiences);

    expect(sorted[0]?.company).toBe('Bridges Academy');

    const connecticutCollege = sorted.find((experience) => experience.company === 'Connecticut College');
    expect(connecticutCollege?.positions[0]?.period).toBe('Jan 2020 - May 2021');
    expect(connecticutCollege?.latestPeriod).toBe('Jan 2020 - May 2021');
  });

  it('returns motion config tuned for performance tiers', () => {
    const liteConfig = getExperienceMotionConfig('lite');
    const fullConfig = getExperienceMotionConfig('full');

    expect(liteConfig.isLiteMotion).toBe(true);
    expect(liteConfig.timelineStagger).toBe(0.04);
    expect(fullConfig.isCinematic).toBe(true);
    expect(fullConfig.timelineTravel).toBe(32);
  });

  it('builds deterministic DOM ids for experience items', () => {
    expect(getExperienceItemId(3)).toBe('experience-item-3');
  });
});
