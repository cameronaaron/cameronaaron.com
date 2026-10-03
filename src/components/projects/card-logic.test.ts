import { describe, expect, it } from 'vitest';
import {
  PROJECT_CARD_MAX_TAGS,
  getProjectCardCta,
  getProjectCardLinkProps,
  getProjectReadingMinutes,
  getProjectTopTags,
} from '@/components/projects/card-logic';

describe('project card logic', () => {
  it('derives reading time with a minimum floor', () => {
    expect(getProjectReadingMinutes('short text')).toBe(2);
    expect(getProjectReadingMinutes('a'.repeat(390))).toBe(3);
  });

  it('returns explicit CTA text with fallback', () => {
    expect(getProjectCardCta('View Abstract')).toBe('View Abstract');
    expect(getProjectCardCta()).toBe('Read More');
  });

  it('caps top tags at PROJECT_CARD_MAX_TAGS', () => {
    const tags = ['a', 'b', 'c', 'd', 'e'];
    expect(getProjectTopTags(tags)).toEqual(['a', 'b', 'c']);
    expect(getProjectTopTags(tags)).toHaveLength(PROJECT_CARD_MAX_TAGS);
  });

  it('returns the same array reference when tags already fit — zero allocation', () => {
    const tags = ['a', 'b'];
    expect(getProjectTopTags(tags)).toBe(tags);
    const exact = ['a', 'b', 'c'];
    expect(getProjectTopTags(exact)).toBe(exact);
  });

  it('gives a linked card new-tab anchor attributes', () => {
    expect(getProjectCardLinkProps('https://github.com/cameronaaron/novachannel')).toEqual({
      href: 'https://github.com/cameronaaron/novachannel',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });

  it('gives a private-repository card no anchor attributes at all, without allocating', () => {
    expect(getProjectCardLinkProps(undefined)).toEqual({});
    expect(getProjectCardLinkProps('')).toEqual({});
    expect(getProjectCardLinkProps(undefined)).toBe(getProjectCardLinkProps(undefined));
  });
});
