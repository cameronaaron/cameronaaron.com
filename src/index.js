import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const options = {
    // Cache assets in the browser for 1 year
    cacheControl: {
      browserTTL: 31536000,
      edgeTTL: 31536000,
      bypassCache: false,
    },
  };

  try {
    // Serve the static asset from KV
    const response = await getAssetFromKV(event, options);
    
    // Add security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-XSS-Protection', '1; mode=block');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Cache static assets for 1 year
    if (event.request.url.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2)$/)) {
      newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
      // Cache HTML for 1 hour
      newHeaders.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch {
    // Return 404 for missing assets
    return new Response('Not Found', { status: 404 });
  }
}
