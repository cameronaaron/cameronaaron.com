const CANONICAL_HOST = 'cameronaaron.com';
const HOSTS_REDIRECT_TO_ROOT = new Set(['workshop.cameronaaron.com']);
const HOSTS_REDIRECT_WITH_PATH = new Set(['www.cameronaaron.com']);

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

function buildXmlAliasCandidates(pathname, manifestKeys = []) {
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

function withPathname(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url.toString(), request);
}

async function fetchWithXmlAliases(request, env) {
  const url = new URL(request.url);
  const primary = await env.ASSETS.fetch(request);

  if (!url.pathname.endsWith('.xml') || primary.status !== 404) {
    return primary;
  }

  for (const aliasPath of buildXmlAliasCandidates(url.pathname, getManifestKeys())) {
    const aliasResponse = await env.ASSETS.fetch(withPathname(request, aliasPath));
    if (aliasResponse.status !== 404) {
      return aliasResponse;
    }
  }

  return primary;
}

function redirectWithPath(url) {
  const destination = new URL(url.toString());
  destination.protocol = 'https:';
  destination.hostname = CANONICAL_HOST;
  destination.port = '';
  return Response.redirect(destination.toString(), 301);
}

function redirectToCanonicalRoot(url) {
  const destination = new URL(url.toString());
  destination.protocol = 'https:';
  destination.hostname = CANONICAL_HOST;
  destination.port = '';
  destination.pathname = '/';
  return Response.redirect(destination.toString(), 301);
}

function redirectIndexHtml(url) {
  const destination = new URL(url.toString());
  destination.pathname = '/';
  return Response.redirect(destination.toString(), 301);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (HOSTS_REDIRECT_WITH_PATH.has(host)) {
      return redirectWithPath(url);
    }

    if (HOSTS_REDIRECT_TO_ROOT.has(host)) {
      return redirectToCanonicalRoot(url);
    }

    if (url.pathname === '/index.html') {
      return redirectIndexHtml(url);
    }

    return fetchWithXmlAliases(request, env);
  },
};