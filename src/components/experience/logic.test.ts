import { describe, expect, it } from 'vitest';
import { experiences } from '@/data/experience';
import {
  EXPERIENCE_FLOW_PHASES,
  getExperienceItemId,
  getExperienceItemX,
  getExperienceMotionConfig,
  getExperienceNavStaggerDelay,
  getExperiencePhaseStaggerDelay,
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

  it('actually reorders nested positions and experiences by period, not by input order', () => {
    // The real fixture above is already stored newest-first at both levels,
    // so a mutant that swaps either date-key selector for a constant
    // (`() => undefined`) would tie everything and a stable sort would
    // silently preserve that already-correct order. Feed oldest-first input
    // at BOTH levels so only a real key-based sort produces the right shape.
    const oldestFirst = [
      {
        company: 'Older Co',
        logo: '/logo-older.webp',
        positions: [{ title: 'Ancient Role', period: 'Jan 2000', description: '' }],
      },
      {
        company: 'Old Co',
        logo: '/logo-old.webp',
        positions: [
          { title: 'Old Role', period: 'Jan 2010', description: '' },
          { title: 'New Role', period: 'Jan 2024', description: '' },
        ],
      },
    ];
    const sorted = sortExperiencesForTimeline(oldestFirst);

    // Company-level: 'Old Co' (latest position Jan 2024) sorts before
    // 'Older Co' (latest position Jan 2000).
    expect(sorted.map((e) => e.company)).toEqual(['Old Co', 'Older Co']);
    // Position-level within 'Old Co': 'New Role' (2024) sorts before 'Old Role' (2010).
    expect(sorted[0]?.positions.map((p) => p.title)).toEqual(['New Role', 'Old Role']);
    expect(sorted[0]?.latestPeriod).toBe('Jan 2024');
  });

  it('returns motion config tuned for performance tiers', () => {
    const liteConfig = getExperienceMotionConfig('lite');
    const fullConfig = getExperienceMotionConfig('full');

    expect(liteConfig.isLiteMotion).toBe(true);
    expect(liteConfig.timelineStagger).toBe(0.04);
    expect(fullConfig.isCinematic).toBe(true);
    expect(fullConfig.timelineTravel).toBe(32);
  });

  it('treats "reduced" as lite motion too, not just "lite"', () => {
    expect(getExperienceMotionConfig('reduced').isLiteMotion).toBe(true);
  });

  it('is cinematic only on the full tier, not on lite/balanced/reduced', () => {
    expect(getExperienceMotionConfig('lite').isCinematic).toBe(false);
    expect(getExperienceMotionConfig('balanced').isCinematic).toBe(false);
    expect(getExperienceMotionConfig('reduced').isCinematic).toBe(false);
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

    it('returns emerald inactive state when isActive is false', () => {
      const inactive = getTimelineDotAnimation(false, false);
      expect(inactive.scale).toBe(1);
      expect(inactive.backgroundColor).toContain('16 185 129');
    });

    it('uses dimmer boxShadow on lite motion', () => {
      const lite = getTimelineDotAnimation(true, true);
      const full = getTimelineDotAnimation(false, true);
      expect(lite.boxShadow).toContain('0.55');
      expect(full.boxShadow).toContain('0.85');
    });
  });

  describe('getTimelineDotTransition', () => {
    it('never springs backgroundColor or boxShadow, on either motion tier', () => {
      // Springing a color/shadow can serialize to oklab() mid-transition, which some
      // browsers reject for inline-style animation — see the function's own doc comment.
      for (const isLiteMotion of [true, false]) {
        const t = getTimelineDotTransition(isLiteMotion);
        expect(t.backgroundColor).toEqual({ type: 'tween', duration: 0.2, ease: 'easeOut' });
        expect(t.boxShadow).toEqual({ type: 'tween', duration: 0.2, ease: 'easeOut' });
      }
    });

    it('tweens scale on lite motion', () => {
      const t = getTimelineDotTransition(true);
      expect(t.scale).toEqual({ type: 'tween', duration: 0.2, ease: 'easeOut' });
    });

    it('springs scale on full motion', () => {
      const t = getTimelineDotTransition(false);
      expect(t.scale).toEqual({ type: 'spring', stiffness: 280, damping: 22 });
    });
  });

  describe('getExperiencePhaseStaggerDelay', () => {
    it('returns 0 for the first chip', () => {
      expect(getExperiencePhaseStaggerDelay(0, false)).toBe(0);
      expect(getExperiencePhaseStaggerDelay(0, true)).toBe(0);
    });

    it('scales by 0.1 in full motion', () => {
      expect(getExperiencePhaseStaggerDelay(2, false)).toBeCloseTo(0.2);
    });

    it('scales by 0.04 in lite motion', () => {
      expect(getExperiencePhaseStaggerDelay(2, true)).toBeCloseTo(0.08);
    });
  });

  describe('getExperienceNavStaggerDelay', () => {
    it('returns 0 for the first nav button', () => {
      expect(getExperienceNavStaggerDelay(0, false)).toBe(0);
      expect(getExperienceNavStaggerDelay(0, true)).toBe(0);
    });

    it('scales by 0.05 in full motion', () => {
      expect(getExperienceNavStaggerDelay(3, false)).toBeCloseTo(0.15);
    });

    it('scales by 0.02 in lite motion', () => {
      expect(getExperienceNavStaggerDelay(3, true)).toBeCloseTo(0.06);
    });
  });

  describe('getExperienceItemX', () => {
    it('returns 0 for all items in lite motion', () => {
      expect(getExperienceItemX(0, true, 32)).toBe(0);
      expect(getExperienceItemX(1, true, 32)).toBe(0);
    });

    it('returns negative travel for even-index items in full motion', () => {
      expect(getExperienceItemX(0, false, 32)).toBe(-32);
      expect(getExperienceItemX(2, false, 32)).toBe(-32);
    });

    it('returns positive travel for odd-index items in full motion', () => {
      expect(getExperienceItemX(1, false, 32)).toBe(32);
      expect(getExperienceItemX(3, false, 32)).toBe(32);
    });
  });
});
