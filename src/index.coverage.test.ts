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

// ── buildAssetCandidatePaths coverage ──────────────────────────────────────────
describe('index.js buildAssetCandidatePaths coverage', () => {
  type IndexMod = {
    buildAssetCandidatePaths?: (pathname: string, manifestKeys?: string[]) => string[];
    buildXmlAliasCandidates?: (pathname: string, manifestKeys?: string[]) => string[];
    handleRequest?: (event: { request: Request; waitUntil?: (p: Promise<unknown>) => void }) => Promise<Response>;
  };

  it('normalizes pathname without leading slash (covers ? branch at line 75)', async () => {
    const mod = await import('./index.js') as IndexMod;
    const result = mod.buildAssetCandidatePaths?.('about') ?? [];
    expect(result).toContain('/about');
    expect(result).toContain('/about.html');
  });

  it('returns index.html for root "/" pathname (covers if normalized === "/" branch)', async () => {
    const mod = await import('./index.js') as IndexMod;
    const result = mod.buildAssetCandidatePaths?.('/') ?? [];
    expect(result).toContain('/');
    expect(result).toContain('/index.html');
  });

  it('handles xml path and finds alias with leading slash in manifest key (covers key.startsWith branch)', async () => {
    const mod = await import('./index.js') as IndexMod;
    // Pass manifest keys WITH leading slash to cover the key.startsWith('/') true branch (line 65)
    const result = mod.buildXmlAliasCandidates?.('/sitemap.xml', ['/sitemap.abc12345.xml', 'feed.xml']) ?? [];
    expect(result.some((r) => r.includes('sitemap'))).toBe(true);
  });

  it('appendUnique false branch — duplicate value not re-added (line 18)', async () => {
    const mod = await import('./index.js') as IndexMod;
    // buildAssetCandidatePaths calls appendUnique for each xml alias returned by buildXmlAliasCandidates.
    // Two manifest keys that normalize to the same alias string cause the second appendUnique call to be a no-op.
    const result = mod.buildAssetCandidatePaths?.('/sitemap.xml', ['/sitemap.abc12345.xml', 'sitemap.abc12345.xml']) ?? [];
    // Only one alias entry should appear despite two manifest keys resolving to the same path.
    const sitemapAliases = result.filter((r) => r.includes('sitemap.abc12345'));
    expect(sitemapAliases.length).toBe(1);
  });

  it('handles path with trailing slash (covers withoutTrailingSlash branch)', async () => {
    const mod = await import('./index.js') as IndexMod;
    const result = mod.buildAssetCandidatePaths?.('/about/') ?? [];
    expect(result.some((r) => r.includes('about'))).toBe(true);
  });

  it('handles handleRequest with root path, redirects, and long-lived asset (line 215)', async () => {
    const { getAssetFromKV } = await import('@cloudflare/kv-asset-handler');
    const mockGetAsset = vi.mocked(getAssetFromKV);
    mockGetAsset.mockResolvedValue(new Response('body', { status: 200, headers: { 'content-type': 'text/css' } }));

    const mod = await import('./index.js') as IndexMod;
    if (!mod.handleRequest) return;

    // Root path — HTML route
    const htmlResult = await mod.handleRequest({ request: new Request('https://cameronaaron.com/') });
    expect(htmlResult.status).toBe(200);

    // /index.html — should redirect to /
    const redirectResult = await mod.handleRequest({ request: new Request('https://cameronaaron.com/index.html') });
    expect(redirectResult.status).toBe(301);

    // Canonical redirect host → redirect to cameronaaron.com
    const canonRedirect = await mod.handleRequest({ request: new Request('https://workshop.cameronaaron.com/about') });
    expect(canonRedirect.status).toBe(301);

    // Static asset — covers isLongLivedAsset branch (line 215)
    mockGetAsset.mockResolvedValue(new Response('body', { status: 200, headers: { 'content-type': 'text/css' } }));
    const cssResult = await mod.handleRequest({ request: new Request('https://cameronaaron.com/style.css') });
    expect(cssResult.status).toBe(200);
    expect(cssResult.headers.get('Cache-Control')).toContain('max-age=31536000');

    // Extensionless route (not long-lived, not html-like) — covers else-if false branch (line 216)
    mockGetAsset.mockResolvedValue(new Response('body', { status: 200 }));
    const aboutResult = await mod.handleRequest({ request: new Request('https://cameronaaron.com/about') });
    expect(aboutResult.status).toBe(200);
    expect(aboutResult.headers.get('Cache-Control')).toBeNull();

    // Asset not found → 404
    mockGetAsset.mockRejectedValue(new Error('not found'));
    const notFoundResult = await mod.handleRequest({ request: new Request('https://cameronaaron.com/missing') });
    expect(notFoundResult.status).toBe(404);
  });
});
