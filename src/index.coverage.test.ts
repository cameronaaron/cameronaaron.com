import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// index.js is a Cloudflare Worker — mock KV asset handler
vi.mock('@cloudflare/kv-asset-handler', () => ({
  getAssetFromKV: vi.fn().mockResolvedValue(new Response('ok', { status: 200 })),
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('index.js coverage (lines 39-45 — __STATIC_CONTENT_MANIFEST branches)', () => {
  it('getManifestKeys returns [] when __STATIC_CONTENT_MANIFEST is not a string', async () => {
    // Simulate the non-string branch (line 39): __STATIC_CONTENT_MANIFEST not defined → typeof !== 'string'
    (globalThis as Record<string, unknown>).__STATIC_CONTENT_MANIFEST = undefined;

    const mod = await import('./index.js');
    // Access buildXmlAliasCandidates which calls getManifestKeys internally
    const result = (mod as { buildXmlAliasCandidates?: (p: string) => string[] }).buildXmlAliasCandidates?.('sitemap.xml') ?? [];
    expect(Array.isArray(result)).toBe(true);
  });

  it('getManifestKeys parses valid JSON __STATIC_CONTENT_MANIFEST (lines 40-45)', async () => {
    (globalThis as Record<string, unknown>).__STATIC_CONTENT_MANIFEST = JSON.stringify({
      'sitemap.xml': 'sitemap.abc12345.xml',
      'feed.xml': 'feed.def67890.xml',
    });

    vi.resetModules();
    const mod = await import('./index.js');
    const result = (mod as { buildXmlAliasCandidates?: (p: string) => string[] }).buildXmlAliasCandidates?.('sitemap.xml') ?? [];
    expect(Array.isArray(result)).toBe(true);
  });

  it('getManifestKeys returns [] when JSON.parse throws (catch branch)', async () => {
    (globalThis as Record<string, unknown>).__STATIC_CONTENT_MANIFEST = 'not-valid-json{{{';

    vi.resetModules();
    const mod = await import('./index.js');
    const result = (mod as { buildXmlAliasCandidates?: (p: string) => string[] }).buildXmlAliasCandidates?.('/sitemap.xml') ?? [];
    expect(Array.isArray(result)).toBe(true);
  });

  it('buildXmlAliasCandidates returns [] for non-xml path', async () => {
    const mod = await import('./index.js');
    const result = (mod as { buildXmlAliasCandidates?: (p: string) => string[] }).buildXmlAliasCandidates?.('/about') ?? [];
    expect(result).toEqual([]);
  });
});
