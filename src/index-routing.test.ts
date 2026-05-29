import { describe, expect, it } from 'vitest';

import { buildAssetCandidatePaths, buildXmlAliasCandidates } from './index.js';

describe('worker asset route fallback resolution', () => {
  it('resolves clean capstone routes to exported html assets', () => {
    expect(buildAssetCandidatePaths('/capstone')).toEqual([
      '/capstone',
      '/capstone.html',
      '/capstone/index.html',
    ]);

    expect(buildAssetCandidatePaths('/capstone/')).toEqual([
      '/capstone/',
      '/capstone.html',
      '/capstone/index.html',
    ]);
  });

  it('resolves other clean-route pages that were affected by the same worker behavior', () => {
    expect(buildAssetCandidatePaths('/credentials')).toEqual([
      '/credentials',
      '/credentials.html',
      '/credentials/index.html',
    ]);

    expect(buildAssetCandidatePaths('/internet')).toEqual([
      '/internet',
      '/internet.html',
      '/internet/index.html',
    ]);
  });

  it('keeps static assets extension-based and does not rewrite them', () => {
    expect(buildAssetCandidatePaths('/profile.webp')).toEqual(['/profile.webp']);
    expect(buildAssetCandidatePaths('/_next/static/chunks/main.js')).toEqual([
      '/_next/static/chunks/main.js',
    ]);
    expect(buildAssetCandidatePaths('/sw.js')).toEqual(['/sw.js']);
  });

  it('supports site root default document fallback', () => {
    expect(buildAssetCandidatePaths('/')).toEqual(['/', '/index.html']);
  });

  it('adds hashed xml aliases when sitemap xml files are fingerprinted in the manifest', () => {
    const manifestKeys = [
      'sitemap.a58d6c3af4.xml',
      'sitemap-images.291416fe93.xml',
      '_next/static/chunks/main.1234.js',
    ];

    expect(buildXmlAliasCandidates('/sitemap.xml', manifestKeys)).toEqual([
      '/sitemap.a58d6c3af4.xml',
    ]);

    expect(buildXmlAliasCandidates('/sitemap-images.xml', manifestKeys)).toEqual([
      '/sitemap-images.291416fe93.xml',
    ]);

    expect(buildAssetCandidatePaths('/sitemap.xml', manifestKeys)).toEqual([
      '/sitemap.xml',
      '/sitemap.a58d6c3af4.xml',
    ]);
  });
});
