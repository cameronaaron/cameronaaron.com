import { describe, expect, it, vi } from 'vitest';

vi.mock('@cloudflare/kv-asset-handler', () => ({
  getAssetFromKV: vi.fn(),
}));

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

describe('cloudflare worker entrypoint', () => {
  it('registers fetch handler and applies cache headers for assets and html', async () => {
    vi.resetModules();

    const listeners = new Map<string, (event: { request: Request; respondWith: (value: Promise<Response>) => void }) => void>();
    Object.defineProperty(globalThis, 'addEventListener', {
      writable: true,
      value: vi.fn((type: string, callback: (event: { request: Request; respondWith: (value: Promise<Response>) => void }) => void) => {
        listeners.set(type, callback);
      }),
    });

    const mockedGetAsset = vi.mocked(getAssetFromKV);
    mockedGetAsset.mockResolvedValue(new Response('ok', { headers: new Headers() }));

    await import('./index.js');

    const handler = listeners.get('fetch');
    expect(handler).toBeTruthy();

    const responses: Promise<Response>[] = [];

    handler?.({
      request: new Request('https://example.com/app.js'),
      respondWith: (value) => responses.push(value),
    });

    handler?.({
      request: new Request('https://example.com/'),
      respondWith: (value) => responses.push(value),
    });

    const assetResponse = await responses[0];
    const htmlResponse = await responses[1];

    expect(assetResponse.headers.get('Cache-Control')).toContain('immutable');
    expect(htmlResponse.headers.get('Cache-Control')).toContain('must-revalidate');
    expect(assetResponse.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('returns 404 when asset lookup fails', async () => {
    vi.resetModules();

    const listeners = new Map<string, (event: { request: Request; respondWith: (value: Promise<Response>) => void }) => void>();
    Object.defineProperty(globalThis, 'addEventListener', {
      writable: true,
      value: vi.fn((type: string, callback: (event: { request: Request; respondWith: (value: Promise<Response>) => void }) => void) => {
        listeners.set(type, callback);
      }),
    });

    const mockedGetAsset = vi.mocked(getAssetFromKV);
    mockedGetAsset.mockRejectedValue(new Error('missing'));

    await import('./index.js');

    const responses: Promise<Response>[] = [];
    listeners.get('fetch')?.({
      request: new Request('https://example.com/missing.js'),
      respondWith: (value) => responses.push(value),
    });

    const response = await responses[0];
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });
});
