/**
 * Headers integrity contract.
 *
 * public/_headers is production security and caching policy for the whole
 * site — Cloudflare Pages applies it verbatim, and nothing else reviews it.
 * A well-meaning edit could drop HSTS or make the service worker cacheable
 * (breaking every future SW update) with zero test failures. Same policy as
 * config-integrity: pin the load-bearing lines.
 *
 * Also verifies every preload `Link:` header points at a file that actually
 * exists in public/ — a renamed hero image would otherwise silently turn the
 * LCP preload into a 404 on every page load.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const HEADERS = readFileSync(join(ROOT, 'public', '_headers'), 'utf8');

/** Return the indented header lines under an exact path rule. */
function blockFor(pathRule: string): string {
  const lines = HEADERS.split('\n');
  const start = lines.findIndex((line) => line.trim() === pathRule);
  if (start === -1) return '';
  const block: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s+\S/.test(lines[i])) block.push(lines[i].trim());
    else if (lines[i].trim() !== '' && !lines[i].startsWith('#')) break;
  }
  return block.join('\n');
}

describe('headers-integrity-contract — security headers on every page', () => {
  const site = blockFor('/*');

  it('the /* block exists', () => {
    expect(site, 'public/_headers must have a /* block carrying the security headers').not.toBe('');
  });

  it('pins the security header set', () => {
    expect(site).toContain('X-Frame-Options: DENY');
    expect(site).toContain('X-Content-Type-Options: nosniff');
    expect(site).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(site).toMatch(/Strict-Transport-Security: max-age=\d{7,}; includeSubDomains; preload/);
    expect(site).toContain('Cross-Origin-Opener-Policy: same-origin');
    expect(site).toContain('Cross-Origin-Embedder-Policy: require-corp');
    expect(site).toMatch(/Permissions-Policy: .*camera=\(\)/);
  });

  // /bridging-transitions is the QR-code destination printed on the SNS26
  // poster and its whole purpose is an embedded YouTube playlist. Measured in
  // a real Chrome (scripts/checks/coep-youtube-embed-probe.mjs): under the
  // site-wide `Cross-Origin-Embedder-Policy: require-corp` above, the
  // youtube-nocookie frame never commits — it stays empty and logs nothing.
  // `credentialless` fails the same way, because COEP relaxes subresources
  // while a nested DOCUMENT must still assert COEP itself and YouTube sends
  // only the report-only variant.
  //
  // So the detach below is load-bearing: delete it and the page silently
  // renders a blank player in production while every test here still passes
  // and local `next dev` (which sends no _headers at all) looks perfect.
  // Both spellings are pinned because Cloudflare Pages matches on the request
  // path, which is `/bridging-transitions` for a visitor and
  // `/bridging-transitions.html` for anyone who kept the extension.
  describe('the YouTube-embedding route detaches COEP', () => {
    it.each(['/bridging-transitions', '/bridging-transitions.html'])(
      '%s detaches Cross-Origin-Embedder-Policy',
      (route) => {
        expect(
          blockFor(route),
          `public/_headers must keep a "${route}" block; without it the embedded playlist is blocked by the site-wide require-corp`,
        ).toContain('! Cross-Origin-Embedder-Policy');
      },
    );

    it('detaches COEP without weakening the rest of the security set on that route', () => {
      // The detach must stay surgical — a block that also dropped COOP or
      // HSTS would trade a working embed for a real regression.
      for (const route of ['/bridging-transitions', '/bridging-transitions.html']) {
        const block = blockFor(route);
        for (const kept of ['Cross-Origin-Opener-Policy', 'Strict-Transport-Security', 'X-Frame-Options']) {
          expect(block, `${route} must not detach or override ${kept}`).not.toContain(kept);
        }
      }
    });

    it('serves the poster PDFs the page links to', () => {
      const poster = blockFor('/poster/*');
      expect(poster).toContain('Content-Type: application/pdf');
      expect(poster).toContain('immutable');
    });
  });
});

describe('headers-integrity-contract — caching policy', () => {
  it('the service worker is never cached (a cached sw.js can pin users to a stale site)', () => {
    const sw = blockFor('/sw.js');
    expect(sw).toContain('no-cache');
    expect(sw).toContain('must-revalidate');
  });

  it('hashed static assets are immutable for a year', () => {
    const nextStatic = blockFor('/_next/static/*');
    expect(nextStatic).toContain('max-age=31536000');
    expect(nextStatic).toContain('immutable');
  });

  it('HTML is always revalidated (deploys take effect immediately)', () => {
    const html = blockFor('/*.html');
    expect(html).toContain('max-age=0');
    expect(html).toContain('must-revalidate');
  });
});

describe('headers-integrity-contract — preload targets exist', () => {
  it('every Link: preload header points at a real file in public/', () => {
    const missing: string[] = [];
    for (const match of HEADERS.matchAll(/Link:\s*<([^>]+)>;\s*rel=preload/g)) {
      const target = match[1];
      if (!existsSync(join(ROOT, 'public', target))) {
        missing.push(`  ${target}`);
      }
    }
    expect(
      missing,
      `preload Link header(s) point at files that do not exist in public/:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('preload hygiene: image preloads are media-scoped and never favicon/manifest assets (§9.2)', () => {
    // A preload is a spent budget competing with the LCP image. Two defects
    // this sweep exists to keep out (both shipped until the 2026-07-23
    // audit): an 18.8KB PWA icon preloaded on every page load despite never
    // rendering in any page, and the desktop hero image preloaded on mobile
    // viewports that paint the small variant — a guaranteed double-download.
    // Rule: as=image preloads name a resource the current viewport actually
    // paints, so each must carry a media= scope, and favicon/manifest assets
    // (icons/, apple-touch-icon) are never preload targets.
    const offenders: string[] = [];
    for (const match of HEADERS.matchAll(/Link:\s*<([^>]+)>;([^\n]*)rel=preload([^\n]*)/g)) {
      const [line, target] = [match[0], match[1]];
      if (!/as=image/.test(line)) continue;
      if (/^\/(icons\/|apple-touch-icon)/.test(target)) {
        offenders.push(`  ${target} — favicon/manifest asset; browsers fetch these on their own schedule, never preload them`);
      }
      if (!/media="[^"]+"/.test(line)) {
        offenders.push(`  ${target} — image preload without a media= scope; every viewport pays for it whether it paints it or not`);
      }
    }
    expect(
      offenders,
      `preload-hygiene violation(s) in public/_headers:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
