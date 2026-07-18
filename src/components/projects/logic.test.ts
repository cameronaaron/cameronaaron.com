import { describe, expect, it } from 'vitest';
import type { Project } from '@/data/projects';
import { projects } from '@/data/projects';
import { buildProjectCollections, getResearchSignals } from '@/components/projects/logic';

function makeProject(overrides: Partial<Project>): Project {
  return { title: 'T', description: 'D', link: 'https://example.com', tags: [], period: 'Jan 2020', ...overrides };
}

describe('projects logic', () => {
  it('builds featured and non-featured collections sorted by recency', () => {
    const { featuredProjects, otherProjects } = buildProjectCollections(projects);

    expect(featuredProjects[0]?.title).toContain('Bridging Transitions');
    expect(otherProjects[0]?.title).toContain('thehellisthis.com');
  });

  it('actually reorders featured projects by period, not by input order', () => {
    // The real fixture is already newest-first, so a mutant that swaps the
    // `project.period` key selector for a constant (`() => undefined`) would
    // tie every item and a stable sort would silently preserve that order.
    const oldestFirst = [
      makeProject({ title: 'Old', period: 'Jan 2010', featured: true }),
      makeProject({ title: 'New', period: 'Jan 2024', featured: true }),
    ];
    const { featuredProjects } = buildProjectCollections(oldestFirst);
    expect(featuredProjects.map((p) => p.title)).toEqual(['New', 'Old']);
  });

  it('deduplicates research signals and applies the requested limit', () => {
    const signals = getResearchSignals(projects, 5);

    expect(signals).toHaveLength(5);
    expect(new Set(signals).size).toBe(signals.length);
  });

  it('skips an already-seen tag rather than re-adding it (exact output, not just a length check)', () => {
    // With real fixture data, the first `limit` tags across all projects
    // happen to already be unique, so a mutant that disables the `seen.has`
    // dedup check entirely still produces a same-length, same-uniqueness
    // result by coincidence. Force an immediate repeat within the very first
    // project's own tag list so a real dedup check is required to reach the
    // second, distinct tag before hitting the limit.
    const items = [makeProject({ tags: ['x', 'x', 'y'] })];
    expect(getResearchSignals(items, 2)).toEqual(['x', 'y']);
  });

  it('starts each call from an empty signals list (no stray seed values)', () => {
    const items = [makeProject({ tags: ['solo'] })];
    expect(getResearchSignals(items, 5)).toEqual(['solo']);
  });

  it('includes research signals as part of the collection payload', () => {
    const { researchSignals } = buildProjectCollections(projects);

    expect(researchSignals.length).toBeLessThanOrEqual(10);
    expect(researchSignals.length).toBeGreaterThan(0);
  });
});
