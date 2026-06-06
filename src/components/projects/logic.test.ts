import { describe, expect, it } from 'vitest';
import { projects } from '@/data/projects';
import { buildProjectCollections, getResearchSignals } from '@/components/projects/logic';

describe('projects logic', () => {
  it('builds featured and non-featured collections sorted by recency', () => {
    const { featuredProjects, otherProjects } = buildProjectCollections(projects);

    expect(featuredProjects[0]?.title).toContain('Bridging Transitions');
    expect(otherProjects[0]?.title).toContain('thehellisthis.com');
  });

  it('deduplicates research signals and applies the requested limit', () => {
    const signals = getResearchSignals(projects, 5);

    expect(signals).toHaveLength(5);
    expect(new Set(signals).size).toBe(signals.length);
  });

  it('includes research signals as part of the collection payload', () => {
    const { researchSignals } = buildProjectCollections(projects);

    expect(researchSignals.length).toBeLessThanOrEqual(10);
    expect(researchSignals.length).toBeGreaterThan(0);
  });
});
