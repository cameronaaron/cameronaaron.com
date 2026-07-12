import { describe, expect, it } from 'vitest';
import { getPageUrl, SITE_URL } from './site';

describe('site identity', () => {
  it('SITE_URL is an absolute https URL with no trailing slash', () => {
    expect(SITE_URL).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    expect(SITE_URL.endsWith('/')).toBe(false);
  });

  it('getPageUrl builds a single-slash absolute URL for a given path', () => {
    expect(getPageUrl('/capstone')).toBe(`${SITE_URL}/capstone`);
    expect(getPageUrl('capstone')).toBe(`${SITE_URL}/capstone`);
    expect(getPageUrl('/capstone/')).toBe(`${SITE_URL}/capstone`);
  });

  it('getPageUrl returns the root with a trailing slash for "/" or no argument', () => {
    expect(getPageUrl()).toBe(`${SITE_URL}/`);
    expect(getPageUrl('/')).toBe(`${SITE_URL}/`);
  });

  it('getPageUrl never produces a double slash', () => {
    expect(getPageUrl('/sitemap.xml')).not.toContain('//sitemap');
    expect(getPageUrl('nested/path')).toBe(`${SITE_URL}/nested/path`);
  });
});
