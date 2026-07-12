import { describe, expect, it } from 'vitest';
import { getPageUrl } from '@/data/site';
import { buildCredentialsMetadata } from './metadata';

describe('buildCredentialsMetadata', () => {
  const pageUrl = getPageUrl('/credentials');
  const metadata = buildCredentialsMetadata(pageUrl);

  it('threads the page URL into OpenGraph', () => {
    expect(metadata.openGraph?.url).toBe(pageUrl);
  });

  it('canonical alternate points at the page-relative path', () => {
    expect(metadata.alternates?.canonical).toBe('/credentials');
  });

  it('is a pure function of its input', () => {
    expect(buildCredentialsMetadata(pageUrl)).toEqual(buildCredentialsMetadata(pageUrl));
  });
});
