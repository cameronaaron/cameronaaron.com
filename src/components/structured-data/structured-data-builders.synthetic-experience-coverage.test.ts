import { describe, expect, it, vi } from 'vitest';

// This file exists purely to make two mutants in buildStructuredDataGraph's
// workExperienceSchema/personSchema construction observable — neither is
// reachable through the real `experiences`/`skills` data as of writing:
//
// 1. `exp.positions[0]?.period` / `exp.positions[0]?.title` (optional
//    chaining): every real experience entry has >=1 position, so the `?.`
//    never actually short-circuits against real data. Mocking a company
//    with an empty `positions` array forces `exp.positions[0]` to be
//    `undefined`, distinguishing the real (safe, returns undefined) behavior
//    from the mutant (removes `?.`, throws reading `.period`/`.title` off
//    undefined).
// 2. `roleNames.slice(0, 12)` cap: real data has only 11 unique position
//    titles, so slicing to 12 is a no-op against real data and the mutant
//    (which removes the `.slice(0, 12)` entirely) produces an identical
//    result. Mocking >12 unique titles makes the cap load-bearing.
vi.mock('@/data/experience', () => ({
  experiences: [
    { company: 'Empty Positions Co', positions: [] },
    ...Array.from({ length: 13 }, (_, i) => ({
      company: `Synthetic Co ${i + 1}`,
      positions: [{ title: `Synthetic Role ${i + 1}`, period: `Jan 20${10 + i} - Feb 20${11 + i}` }],
    })),
  ],
}));

import { buildStructuredDataGraph } from './structured-data-builders';

type SchemaNode = { '@type': string; [key: string]: unknown };

describe('structured data builders — synthetic-experience-only mutants', () => {
  const graph = buildStructuredDataGraph();
  const nodes = graph['@graph'] as SchemaNode[];

  it('does not throw when an experience has an empty positions array, and omits roleName/startDate/endDate for it', () => {
    const workExperience = nodes.find(
      (n) => n['@type'] === 'ItemList' && n.name === 'Professional Experience'
    )!;
    const items = workExperience.itemListElement as Array<{ item: SchemaNode }>;
    const emptyPositionsEntry = items[0].item;

    expect(emptyPositionsEntry.roleName).toBeUndefined();
    expect('startDate' in emptyPositionsEntry).toBe(false);
    expect('endDate' in emptyPositionsEntry).toBe(false);
    // Still correctly shaped otherwise — the guard doesn't break the rest.
    expect(emptyPositionsEntry['@type']).toBe('OrganizationRole');
    expect(emptyPositionsEntry.worksFor).toEqual({ '@type': 'Organization', name: 'Empty Positions Co' });
  });

  it('caps hasOccupation at exactly 12 entries when more than 12 unique role titles exist', () => {
    const person = nodes.find((n) => n['@type'] === 'Person')!;
    const occupation = person.hasOccupation as Array<{ name: string }>;

    // 13 synthetic companies each contribute one unique title (the empty-
    // positions company contributes none) — 13 unique titles available,
    // capped down to 12.
    expect(occupation.length).toBe(12);
    expect(occupation.map((o) => o.name)).toEqual(
      Array.from({ length: 12 }, (_, i) => `Synthetic Role ${i + 1}`)
    );
    // The 13th title must be excluded — proves the cap actually truncates.
    expect(occupation.some((o) => o.name === 'Synthetic Role 13')).toBe(false);
  });
});
