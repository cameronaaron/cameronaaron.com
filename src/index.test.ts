import { describe, expect, it, vi } from 'vitest';

vi.mock('@cloudflare/kv-asset-handler', () => ({
  getAssetFromKV: vi.fn(),
}));

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

describe('cloudflare worker entrypoint', () => {
  it('redirects workshop subdomain traffic to the canonical site before asset lookup', async () => {
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

    const responses: Promise<Response>[] = [];
    listeners.get('fetch')?.({
      request: new Request('https://workshop.cameronaaron.com/projects?ref=lab'),
      respondWith: (value) => responses.push(value),
    });

    const response = await responses[0];

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://cameronaaron.com/projects?ref=lab');
    expect(mockedGetAsset).not.toHaveBeenCalled();
  });

  it('sanitizes cache-busting asset requests before lookup and applies html cache headers', async () => {
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

    const invoke = async (requestUrl: string, init?: RequestInit) => {
      const responses: Promise<Response>[] = [];

      handler?.({
        request: new Request(requestUrl, init),
        respondWith: (value) => responses.push(value),
      });

      return responses[0];
    };

    const assetResponse = await invoke('https://example.com/app.js', {
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    });
    const htmlResponse = await invoke('https://example.com/');

    expect(mockedGetAsset.mock.calls[0]?.[0]?.request.headers.get('cache-control')).toBeNull();
    expect(assetResponse.status).toBe(200);
    // HTML must NOT use no-store — it would block browser bfcache.
    expect(htmlResponse.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
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
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
});
