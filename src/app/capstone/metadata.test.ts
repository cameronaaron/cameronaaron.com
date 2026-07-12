import { describe, expect, it } from 'vitest';
import { getPageUrl } from '@/data/site';
import { buildCapstoneMetadata } from './metadata';

describe('buildCapstoneMetadata', () => {
  const pageUrl = getPageUrl('/capstone');
  const metadata = buildCapstoneMetadata(pageUrl);

  it('threads the page URL into canonical alternates and OpenGraph', () => {
    expect(metadata.openGraph?.url).toBe(pageUrl);
  });

  it('has no duplicate keywords', () => {
    const keywords = metadata.keywords as string[];
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it('OpenGraph and Twitter cards derive their image URLs from getPageUrl, not a hardcoded domain', () => {
    const ogImage = metadata.openGraph?.images;
    const ogImageEntry = Array.isArray(ogImage) ? ogImage[0] : ogImage;
    expect(ogImageEntry).toMatchObject({ url: getPageUrl('/social/opengraph-image.png') });

    const twitterImages = metadata.twitter && 'images' in metadata.twitter ? metadata.twitter.images : undefined;
    const twitterImage = Array.isArray(twitterImages) ? twitterImages[0] : twitterImages;
    expect(twitterImage).toBe(getPageUrl('/social/twitter-image.png'));
  });

  it('is a pure function of its input — same URL in, identical metadata out', () => {
    expect(buildCapstoneMetadata(pageUrl)).toEqual(buildCapstoneMetadata(pageUrl));
  });
});
