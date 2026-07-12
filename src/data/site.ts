/** Canonical site identity — the single source of truth for the domain.
 *  Every URL built anywhere in the app (metadata, sitemap, robots,
 *  structured data) derives from this, so a domain change is a one-line
 *  edit instead of a repo-wide find/replace across N hardcoded literals. */
export const SITE_URL = 'https://cameronaaron.com';

/** Build an absolute URL for a site-relative path. Always normalizes to
 *  exactly one slash between the origin and the path. */
export function getPageUrl(path: string = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath === '/' ? '/' : normalizedPath.replace(/\/$/, '')}`;
}
