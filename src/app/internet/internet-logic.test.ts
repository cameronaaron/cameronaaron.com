import { describe, expect, it } from 'vitest';

import type { InternetFeature } from '@/data/internetFeatures';
import { internetFeatures } from '@/data/internetFeatures';
import { CATEGORY_ORDER, groupFeaturesByCategory } from './internet-logic';

function feature(overrides: Partial<InternetFeature>): InternetFeature {
  return {
    title: 'Title',
    organization: 'Org',
    period: 'Jan 2024',
    summary: 'Summary',
    category: 'Media',
    ...overrides,
  };
}

describe('groupFeaturesByCategory', () => {
  it('buckets features into CATEGORY_ORDER order regardless of input order', () => {
    const groups = groupFeaturesByCategory([
      feature({ title: 'P', category: 'Profiles' }),
      feature({ title: 'S', category: 'Speaking' }),
      feature({ title: 'R', category: 'Research' }),
      feature({ title: 'M', category: 'Media' }),
    ]);

    expect(groups.map((group) => group.category)).toEqual(['Speaking', 'Media', 'Research', 'Profiles']);
  });

  it('preserves input order within a category (date-sorted stays date-sorted)', () => {
    const groups = groupFeaturesByCategory([
      feature({ title: 'newest', category: 'Media' }),
      feature({ title: 'older', category: 'Media' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((item) => item.title)).toEqual(['newest', 'older']);
  });

  it('drops empty categories so the page renders no empty headings', () => {
    const groups = groupFeaturesByCategory([feature({ category: 'Research' })]);
    expect(groups.map((group) => group.category)).toEqual(['Research']);
  });

  it('ignores features whose category is not in the provided order', () => {
    const rogue = feature({ title: 'rogue' });
    (rogue as { category: string }).category = 'Unknown';

    const groups = groupFeaturesByCategory([rogue, feature({ category: 'Speaking' })]);
    expect(groups.map((group) => group.category)).toEqual(['Speaking']);
    expect(groups[0].items).toHaveLength(1);
  });

  it('covers every category present in the real data set', () => {
    const groups = groupFeaturesByCategory(internetFeatures);
    const grouped = groups.reduce((total, group) => total + group.items.length, 0);
    expect(grouped).toBe(internetFeatures.length);
    for (const group of groups) {
      expect(CATEGORY_ORDER).toContain(group.category);
    }
  });
});
