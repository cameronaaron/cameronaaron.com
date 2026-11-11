import { describe, expect, it } from 'vitest';
import { sortExperiencesForTimeline } from '@/components/experience/experience-logic';
import type { Experience } from '@/data/experience';

describe('experience logic — coverage fill for lines 31 and 57', () => {
  describe('sortExperiencesForTimeline — line 31: latestPeriod fallback to empty string', () => {
    it('sets latestPeriod to empty string when an experience has no positions (nullish coalescing ?? branch)', () => {
      const itemWithNoPositions: Experience = {
        company: 'Empty Corp',
        logo: '/empty.png',
        positions: [],
      };

      const result = sortExperiencesForTimeline([itemWithNoPositions]);

      expect(result).toHaveLength(1);
      expect(result[0]?.latestPeriod).toBe('');
      expect(result[0]?.positions).toEqual([]);
    });

    it('falls back to empty string when mixed with real experiences', () => {
      const itemWithPositions: Experience = {
        company: 'Real Corp',
        logo: '/real.png',
        positions: [{ title: 'Engineer', period: 'Jan 2023 - Dec 2023', description: 'Did things.' }],
      };
      const itemWithNoPositions: Experience = {
        company: 'Ghost Corp',
        logo: '/ghost.png',
        positions: [],
      };

      const result = sortExperiencesForTimeline([itemWithNoPositions, itemWithPositions]);

      const ghost = result.find((e) => e.company === 'Ghost Corp');
      expect(ghost?.latestPeriod).toBe('');

      const real = result.find((e) => e.company === 'Real Corp');
      expect(real?.latestPeriod).toBe('Jan 2023 - Dec 2023');
    });
  });
});
