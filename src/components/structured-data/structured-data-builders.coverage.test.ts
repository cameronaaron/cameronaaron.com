import { describe, expect, it, vi } from 'vitest';

vi.mock('@/data/experience', () => ({
  experiences: [
    {
      company: 'Coverage Org',
      positions: [
        { title: '', period: 'Jan 2020 - Feb 2021' },
        { title: 'Coverage Engineer', period: 'Mar 2021 - Apr 2022' },
      ],
    },
  ],
}));

import { buildStructuredDataGraph } from './structured-data-builders';

describe('structured data builders — role-name collection guard', () => {
  it('skips positions with empty titles when collecting occupation names', () => {
    const graph = buildStructuredDataGraph();
    const person = (graph['@graph'] as Array<Record<string, unknown>>).find(
      (node) => node['@type'] === 'Person'
    )!;

    const occupations = (person.hasOccupation as Array<{ name: string }>).map((occ) => occ.name);
    expect(occupations).toEqual(['Coverage Engineer']);
  });
});
