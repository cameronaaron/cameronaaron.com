import { describe, expect, it } from 'vitest';

import {
  SKILLS_JOURNEY_PHASES,
  getDomainCardHoverTransition,
  getSkillBarEntryTransition,
  getSkillColumnVariants,
  getSkillsMotionConfig,
  getStrongestSkill,
  sortTechnicalSkills,
  type TechnicalSkill,
} from './logic';

const SAMPLE: TechnicalSkill[] = [
  { name: 'B', level: 50 },
  { name: 'A', level: 90 },
  { name: 'C', level: 70 },
];

describe('skills logic', () => {
  it('sorts by priority descending', () => {
    const sorted = sortTechnicalSkills(SAMPLE, 'priority');
    expect(sorted.map((skill) => skill.level)).toEqual([90, 70, 50]);
  });

  it('sorts alphabetically by name', () => {
    const sorted = sortTechnicalSkills(SAMPLE, 'alphabetical');
    expect(sorted.map((skill) => skill.name)).toEqual(['A', 'B', 'C']);
  });

  it('returns strongest skill as first element', () => {
    const strongest = getStrongestSkill(sortTechnicalSkills(SAMPLE, 'priority'));
    expect(strongest?.name).toBe('A');
  });

  it('returns undefined for an empty skills array', () => {
    expect(getStrongestSkill([])).toBeUndefined();
  });

  it('does not mutate the original skills array when sorting', () => {
    const original = [...SAMPLE];
    sortTechnicalSkills(SAMPLE, 'priority');
    sortTechnicalSkills(SAMPLE, 'alphabetical');
    expect(SAMPLE).toEqual(original);
  });

  it('SKILLS_JOURNEY_PHASES has the three expected phase labels', () => {
    expect(SKILLS_JOURNEY_PHASES).toHaveLength(3);
    expect(SKILLS_JOURNEY_PHASES).toContain('Assess');
    expect(SKILLS_JOURNEY_PHASES).toContain('Apply');
    expect(SKILLS_JOURNEY_PHASES).toContain('Validate');
  });

  describe('getSkillsMotionConfig', () => {
    it('returns cinematic full-motion config for full tier', () => {
      const config = getSkillsMotionConfig('full');
      expect(config.isLiteMotion).toBe(false);
      expect(config.isCinematic).toBe(true);
      expect(config.entryYOffset).toBe(20);
      expect(config.parallaxRange).toEqual([100, -100]);
      expect(config.staggerDelay).toBe(0.14);
    });

    it('returns reduced-motion config for lite tier', () => {
      const config = getSkillsMotionConfig('lite');
      expect(config.isLiteMotion).toBe(true);
      expect(config.isCinematic).toBe(false);
      expect(config.entryYOffset).toBe(10);
      expect(config.parallaxRange).toEqual([36, -36]);
      expect(config.staggerDelay).toBe(0.06);
    });

    it('returns reduced-motion config for reduced tier', () => {
      const config = getSkillsMotionConfig('reduced');
      expect(config.isLiteMotion).toBe(true);
      expect(config.isCinematic).toBe(false);
    });

    it('returns non-cinematic config for balanced tier', () => {
      const config = getSkillsMotionConfig('balanced');
      expect(config.isLiteMotion).toBe(false);
      expect(config.isCinematic).toBe(false);
    });
  });

  describe('getSkillColumnVariants', () => {
    it('slides left column in from the left on full motion', () => {
      const v = getSkillColumnVariants(false, 'left', 20);
      expect((v.hidden as { x: number }).x).toBe(-36);
      expect(v.hidden.y).toBe(20);
      expect(v.visible.x).toBe(0);
    });

    it('slides right column in from the right on full motion', () => {
      const v = getSkillColumnVariants(false, 'right', 20);
      expect((v.hidden as { x: number }).x).toBe(36);
    });

    it('uses no horizontal offset on lite motion', () => {
      const v = getSkillColumnVariants(true, 'left', 10);
      expect((v.hidden as { x: number }).x).toBe(0);
      expect(v.hidden.y).toBe(10);
    });

    it('uses faster duration on lite motion', () => {
      const lite = getSkillColumnVariants(true, 'left', 10);
      const full = getSkillColumnVariants(false, 'left', 20);
      expect(lite.visible.transition.duration).toBeLessThan(full.visible.transition.duration);
    });
  });

  describe('getDomainCardHoverTransition', () => {
    it('returns tween with no spring props on lite motion', () => {
      const t = getDomainCardHoverTransition(true);
      expect(t.type).toBe('tween');
      expect(t).not.toHaveProperty('stiffness');
      expect(t).not.toHaveProperty('damping');
    });

    it('returns spring with stiffness and damping on full motion', () => {
      const t = getDomainCardHoverTransition(false);
      expect(t.type).toBe('spring');
      expect(t).toHaveProperty('stiffness');
      expect(t).toHaveProperty('damping');
    });
  });

  describe('getSkillBarEntryTransition', () => {
    it('returns a tween transition for lite motion', () => {
      const t = getSkillBarEntryTransition(true, 0);
      expect(t).not.toHaveProperty('type', 'spring');
      expect(t).toHaveProperty('duration');
      expect(t).toHaveProperty('ease');
    });

    it('returns a spring transition for full motion', () => {
      const t = getSkillBarEntryTransition(false, 0);
      expect(t).toHaveProperty('type', 'spring');
      expect(t).toHaveProperty('stiffness');
      expect(t).toHaveProperty('damping');
    });

    it('scales delay by index', () => {
      const t0 = getSkillBarEntryTransition(false, 0);
      const t2 = getSkillBarEntryTransition(false, 2);
      expect(t2.delay).toBeGreaterThan(t0.delay);
    });

    it('lite motion does not include spring-only stiffness/damping props', () => {
      const t = getSkillBarEntryTransition(true, 0);
      expect(t).not.toHaveProperty('stiffness');
      expect(t).not.toHaveProperty('damping');
    });
  });
});
