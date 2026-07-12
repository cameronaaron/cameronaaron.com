import { describe, expect, it } from 'vitest';
import { getPageUrl } from '@/data/site';
import { buildInternetMetadata } from './metadata';

describe('buildInternetMetadata', () => {
  const pageUrl = getPageUrl('/internet');
  const metadata = buildInternetMetadata(pageUrl);

  it('threads the page URL into OpenGraph', () => {
    expect(metadata.openGraph?.url).toBe(pageUrl);
  });

  it('canonical alternate points at the page-relative path', () => {
    expect(metadata.alternates?.canonical).toBe('/internet');
  });

  it('is a pure function of its input', () => {
    expect(buildInternetMetadata(pageUrl)).toEqual(buildInternetMetadata(pageUrl));
  });
});
