import { describe, expect, it } from 'vitest';
import { getPageUrl } from '@/data/site';
import { buildBridgingTransitionsMetadata } from './metadata';

describe('buildBridgingTransitionsMetadata', () => {
  const pageUrl = getPageUrl('/bridging-transitions');
  const metadata = buildBridgingTransitionsMetadata(pageUrl);

  it('threads the page URL into canonical alternates and OpenGraph', () => {
    expect(metadata.alternates?.canonical).toBe('/bridging-transitions');
    expect(metadata.openGraph?.url).toBe(pageUrl);
  });

  it('pins the canonical path, because a printed QR code cannot be redeployed', () => {
    // Every physical copy of the SNS26 poster resolves to this exact path.
    // Renaming the route silently 404s paper that is already in the world, so
    // this assertion is the one place that says so out loud.
    expect(pageUrl).toBe('https://cameronaaron.com/bridging-transitions');
  });

  it('has no duplicate keywords', () => {
    const keywords = metadata.keywords as string[];
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it('OpenGraph and Twitter cards derive their image URLs from getPageUrl, not a hardcoded domain', () => {
    const ogImage = metadata.openGraph?.images;
    const ogImageEntry = Array.isArray(ogImage) ? ogImage[0] : ogImage;
    expect(ogImageEntry).toMatchObject({ url: getPageUrl('/social/opengraph-image.png') });

    const twitterImages =
      metadata.twitter && 'images' in metadata.twitter ? metadata.twitter.images : undefined;
    const twitterImage = Array.isArray(twitterImages) ? twitterImages[0] : twitterImages;
    expect(twitterImage).toBe(getPageUrl('/social/twitter-image.png'));
  });

  it('describes the page in terms someone scanning the poster would search for', () => {
    expect(metadata.description).toContain('Stanford Neurodiversity Summit 2026');
    expect(metadata.keywords).toContain('Stanford Neurodiversity Summit 2026');
    expect(metadata.keywords).toContain('thrice-exceptional Black male students');
  });

  it('is a pure function of its input — same URL in, identical metadata out', () => {
    expect(buildBridgingTransitionsMetadata(pageUrl)).toEqual(
      buildBridgingTransitionsMetadata(pageUrl),
    );
  });
});
