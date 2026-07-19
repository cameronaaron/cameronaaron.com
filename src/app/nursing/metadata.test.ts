import { describe, expect, it } from 'vitest';
import { getPageUrl } from '@/data/site';
import { buildNursingMetadata } from './metadata';

describe('buildNursingMetadata', () => {
  const pageUrl = getPageUrl('/nursing');
  const metadata = buildNursingMetadata(pageUrl);

  it('sets noindex, nofollow — this page must stay out of search results', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('threads the page URL into OpenGraph', () => {
    expect(metadata.openGraph?.url).toBe(pageUrl);
  });

  it('canonical alternate points at the page-relative path', () => {
    expect(metadata.alternates?.canonical).toBe('/nursing');
  });

  it('is a pure function of its input', () => {
    expect(buildNursingMetadata(pageUrl)).toEqual(buildNursingMetadata(pageUrl));
  });
});
