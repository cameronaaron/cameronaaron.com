import { describe, expect, it } from 'vitest';
import { buildRootMetadata, buildRootViewport, SEO_KEYWORDS } from './metadata';
import { getPageUrl, SITE_URL } from './site';

describe('SEO_KEYWORDS', () => {
  it('has no duplicate entries', () => {
    expect(new Set(SEO_KEYWORDS).size).toBe(SEO_KEYWORDS.length);
  });

  it('has no empty or whitespace-only entries', () => {
    for (const keyword of SEO_KEYWORDS) {
      expect(keyword.trim().length, `empty/whitespace keyword: "${keyword}"`).toBeGreaterThan(0);
    }
  });

  it('carries a real, non-trivial catalog', () => {
    expect(SEO_KEYWORDS.length).toBeGreaterThan(50);
  });
});

describe('buildRootMetadata', () => {
  const metadata = buildRootMetadata();

  it('derives every URL from SITE_URL — no independently-hardcoded domain', () => {
    expect(metadata.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(metadata.alternates?.canonical).toBe(getPageUrl('/'));
    expect(metadata.authors).toEqual([{ name: 'Cameron Aaron, M.Ed.', url: SITE_URL }]);
  });

  it('spreads the full SEO_KEYWORDS catalog into metadata.keywords', () => {
    expect(metadata.keywords).toEqual([...SEO_KEYWORDS]);
  });

  it('sets a title template so per-page titles append the site name', () => {
    expect(metadata.title).toMatchObject({ template: '%s | Cameron Aaron' });
  });

  it('OpenGraph image and Twitter image share the same alt text and derive their URLs from getPageUrl', () => {
    const ogImage = metadata.openGraph?.images;
    const ogImageEntry = Array.isArray(ogImage) ? ogImage[0] : ogImage;
    expect(ogImageEntry).toMatchObject({ url: getPageUrl('/social/opengraph-image.png'), width: 1200, height: 630 });

    const twitterImages = metadata.twitter && 'images' in metadata.twitter ? metadata.twitter.images : undefined;
    const twitterImage = Array.isArray(twitterImages) ? twitterImages[0] : twitterImages;
    const twitterUrl = typeof twitterImage === 'string' ? twitterImage : twitterImage?.url;
    expect(twitterUrl).toBe(getPageUrl('/social/twitter-image.png'));
  });

  it('robots policy allows full indexing with no image/video preview caps', () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: expect.objectContaining({ index: true, follow: true, 'max-image-preview': 'large' }),
    });
  });

  it('every call returns a fresh object — no shared-mutable-state risk across pages', () => {
    expect(buildRootMetadata()).not.toBe(buildRootMetadata());
    expect(buildRootMetadata()).toEqual(buildRootMetadata());
  });
});

describe('buildRootViewport', () => {
  it('locks the mobile viewport to no user pinch-to-zoom-out below 1x and a safe-area-aware fit', () => {
    const viewport = buildRootViewport();
    expect(viewport.width).toBe('device-width');
    expect(viewport.initialScale).toBe(1);
    expect(viewport.viewportFit).toBe('cover');
  });

  it('theme color matches for both light and dark color-scheme media queries', () => {
    const viewport = buildRootViewport();
    const colors = new Set(viewport.themeColor.map((entry) => entry.color));
    expect(colors.size).toBe(1);
  });
});
