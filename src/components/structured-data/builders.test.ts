import { describe, expect, it } from 'vitest';

import { buildStructuredDataGraph, splitPeriod, toIsoDate } from './builders';

describe('structured data builders', () => {
  it('parses month-year text to ISO date', () => {
    expect(toIsoDate('March 2024')).toBe('2024-03-01');
    expect(toIsoDate('')).toBeUndefined();
    expect(toIsoDate('not a date')).toBeUndefined();
  });

  it('splits period into start and end dates', () => {
    expect(splitPeriod('March 2024 - April 2025')).toEqual({
      startDate: '2024-03-01',
      endDate: '2025-04-01',
    });
    expect(splitPeriod()).toEqual({});
  });

  it('builds a graph with core schema nodes', () => {
    const graph = buildStructuredDataGraph();
    expect(graph['@context']).toBe('https://schema.org');

    const nodes = graph['@graph'] as Array<{ '@type': string }>;
    const types = nodes.map((node) => node['@type']);

    expect(types).toContain('Person');
    expect(types).toContain('WebSite');
    expect(types).toContain('WebPage');
    expect(types).toContain('FAQPage');
  });

  it('respects custom baseUrl for generated ids', () => {
    const graph = buildStructuredDataGraph('https://example.com');
    const payload = JSON.stringify(graph);

    expect(payload).toContain('https://example.com/#person');
    expect(payload).toContain('https://example.com/capstone');
  });
});
