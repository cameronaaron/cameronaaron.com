import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

const CANONICAL_HOST = 'cameronaaron.com';
const REDIRECT_HOSTS = new Set(['workshop.cameronaaron.com']);

if (typeof addEventListener === 'function') {
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
  });
}

function hasFileExtension(pathname) {
  return /\/[^/]+\.[a-z0-9]+$/i.test(pathname);
}

function appendUnique(list, value) {
  if (!list.includes(value)) {
    list.push(value);
  }
}

let cachedManifestKeys;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getManifestKeys() {
  if (cachedManifestKeys) {
    return cachedManifestKeys;
  }

  try {
    if (typeof __STATIC_CONTENT_MANIFEST !== 'string') {
      cachedManifestKeys = [];
      return cachedManifestKeys;
    }

    const parsed = JSON.parse(__STATIC_CONTENT_MANIFEST);
    cachedManifestKeys = Object.keys(parsed);
  } catch {
    cachedManifestKeys = [];
  }

  return cachedManifestKeys;
}

export function buildXmlAliasCandidates(pathname, manifestKeys = []) {
  if (!pathname.endsWith('.xml')) {
    return [];
  }

  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withoutPrefix = normalizedPath.replace(/^\//, '');
  const basename = withoutPrefix.slice(0, -'.xml'.length);
  const aliasPattern = new RegExp(
    `^${escapeRegex(basename)}\\.[a-f0-9]{8,}\\.xml$`,
    'i'
  );

  const aliases = [];

  for (const key of manifestKeys) {
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    if (aliasPattern.test(normalizedKey)) {
      aliases.push(`/${normalizedKey}`);
    }
  }

  return aliases;
}

export function buildAssetCandidatePaths(pathname, manifestKeys = []) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const candidates = [];

  appendUnique(candidates, normalized);

  if (normalized === '/') {
    appendUnique(candidates, '/index.html');
    return candidates;
  }

  if (hasFileExtension(normalized)) {
    for (const xmlAlias of buildXmlAliasCandidates(normalized, manifestKeys)) {
      appendUnique(candidates, xmlAlias);
    }

    return candidates;
  }

  const withoutTrailingSlash = normalized.endsWith('/')
    ? normalized.slice(0, -1)
    : normalized;

  appendUnique(candidates, `${withoutTrailingSlash}.html`);
  appendUnique(candidates, `${withoutTrailingSlash}/index.html`);

  return candidates;
}

function isLongLivedAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2)$/i.test(pathname);
}

function isHtmlLikePath(pathname) {
  return pathname.endsWith('.html') || pathname.endsWith('/');
}

function buildAssetRequest(url, request) {
  const headers = new Headers(request.headers);
  headers.delete('cache-control');
  headers.delete('pragma');

  return new Request(url.toString(), {
    method: request.method,
    headers,
    redirect: request.redirect,
  });
}

function getCanonicalRedirect(url) {
  if (!REDIRECT_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const redirectUrl = new URL(url.toString());
  redirectUrl.protocol = 'https:';
  redirectUrl.hostname = CANONICAL_HOST;
  redirectUrl.port = '';
  redirectUrl.pathname = '/';

  return redirectUrl;
}

function getIndexHtmlRedirect(url) {
  if (url.pathname !== '/index.html') {
    return null;
  }

  const redirectUrl = new URL(url.toString());
  redirectUrl.pathname = '/';

  return redirectUrl;
}

async function handleRequest(event) {
  const url = new URL(event.request.url);
  const redirectUrl = getCanonicalRedirect(url);

  if (redirectUrl) {
    return Response.redirect(redirectUrl.toString(), 301);
  }

  const indexHtmlRedirectUrl = getIndexHtmlRedirect(url);

  if (indexHtmlRedirectUrl) {
    return Response.redirect(indexHtmlRedirectUrl.toString(), 301);
  }

  const isHtmlRoute = isHtmlLikePath(url.pathname) || url.pathname === '/';
  const options = {
    // Cache static assets aggressively at Cloudflare's edge (bypassCache:
    // false — content-hashed filenames mean a new deploy never reuses an old
    // URL, so a year-long edge cache carries zero staleness risk), but always
    // bypass cache for HTML so fresh deploys do not keep serving stale chunk
    // references.
    //
    // bypassCache: true was set on BOTH branches until 2026-07 — a real bug,
    // not a deliberate trade-off: it meant every static-asset request (every
    // JS/CSS/image on every page view, from every visitor, at every edge PoP)
    // skipped Cloudflare's edge cache entirely and round-tripped through this
    // Worker's KV read on every single request, despite the comment directly
    // above it saying assets should be cached "aggressively." Caught via a
    // live production Lighthouse audit showing `cf-cache-status: DYNAMIC` on
    // every response and real-world mobile TBT/LCP far worse than local
    // testing against a warmed static build ever showed — local tests always
    // hit an already-warm server with no real KV round-trip, so this bug was
    // invisible to every local and CI Lighthouse run.
    cacheControl: isHtmlRoute
      ? {
          browserTTL: 0,
          edgeTTL: 0,
          bypassCache: true,
        }
      : {
          browserTTL: 31536000,
          edgeTTL: 31536000,
          bypassCache: false,
        },
  };

  try {
    const candidates = buildAssetCandidatePaths(url.pathname, getManifestKeys());

    let response;
    let resolvedPath = url.pathname;

    for (const candidatePath of candidates) {
      const candidateUrl = new URL(event.request.url);
      candidateUrl.pathname = candidatePath;

      const candidateRequest = buildAssetRequest(candidateUrl, event.request);

      try {
        // Try extensionless path first, then clean-route fallbacks.
        response = await getAssetFromKV({ ...event, request: candidateRequest }, options);
        resolvedPath = candidatePath;
        break;
      } catch {
        // Continue checking fallbacks.
      }
    }

    if (!response) {
      throw new Error('Asset not found');
    }

    // Add security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-XSS-Protection', '1; mode=block');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Cache static assets for 1 year
    if (isLongLivedAsset(resolvedPath)) {
      newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (isHtmlLikePath(resolvedPath)) {
      // Allow bfcache while still revalidating on each new navigation.
      newHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch {
    // Return 404 for missing assets
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  }
}

export { handleRequest };
