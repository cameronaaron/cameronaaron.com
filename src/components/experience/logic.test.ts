import { describe, expect, it } from 'vitest';
import { experiences } from '@/data/experience';
import {
  EXPERIENCE_FLOW_PHASES,
  getExperienceItemId,
  getExperienceMotionConfig,
  getTimelineDotAnimation,
  getTimelineDotTransition,
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

  describe('getTimelineDotAnimation', () => {
    it('returns cyan active state when isActive is true', () => {
      const active = getTimelineDotAnimation(false, true);
      expect(active.scale).toBe(1.35);
      expect(active.backgroundColor).toContain('34 211 238');
    });

    it('returns purple inactive state when isActive is false', () => {
      const inactive = getTimelineDotAnimation(false, false);
      expect(inactive.scale).toBe(1);
      expect(inactive.backgroundColor).toContain('168 85 247');
    });

    it('uses dimmer boxShadow on lite motion', () => {
      const lite = getTimelineDotAnimation(true, true);
      const full = getTimelineDotAnimation(false, true);
      expect(lite.boxShadow).toContain('0.55');
      expect(full.boxShadow).toContain('0.85');
    });
  });

  describe('getTimelineDotTransition', () => {
    it('returns tween transition on lite motion', () => {
      const t = getTimelineDotTransition(true);
      expect(t).not.toHaveProperty('type', 'spring');
      expect(t).toHaveProperty('duration', 0.2);
    });

    it('returns spring transition on full motion', () => {
      const t = getTimelineDotTransition(false);
      expect(t).toHaveProperty('type', 'spring');
      expect(t).toHaveProperty('stiffness', 280);
      expect(t).toHaveProperty('damping', 22);
    });
  });
});
