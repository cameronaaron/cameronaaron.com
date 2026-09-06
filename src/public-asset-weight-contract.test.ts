/** Image-format checks; asset byte sizes are informational in the build report. */
import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PUBLIC_DIR = resolve(process.cwd(), 'public');

function listPublicFiles(): Array<{ rel: string }> {
  const files: Array<{ rel: string }> = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push({ rel: relative(PUBLIC_DIR, full) });
    }
  };
  walk(PUBLIC_DIR);
  return files;
}

describe('public asset image formats', () => {
  const files = listPublicFiles();

  it('content images ship in modern formats (webp/avif) — no jpg/png outside icons and social cards', () => {
    // webp/avif are 25–60% lighter than jpg/png at equal quality — directly
    // a mobile-LCP win. PNG stays legitimate where platforms require it:
    // PWA icons, apple-touch-icon, favicons, and Open Graph / Twitter cards
    // (some scrapers still reject webp).
    const MODERN_FORMAT_EXEMPT_DIRS = /^(icons|social)\//;
    const MODERN_FORMAT_EXEMPT_FILES = /^(apple-touch-icon\.png|favicon\.ico|favicon(-\d+x\d+)?\.png)$/;
    const legacy: string[] = [];
    for (const file of files) {
      if (!/\.(png|jpe?g)$/i.test(file.rel)) continue;
      if (MODERN_FORMAT_EXEMPT_DIRS.test(file.rel) || MODERN_FORMAT_EXEMPT_FILES.test(file.rel)) continue;
      legacy.push(`  public/${file.rel}`);
    }
    expect(
      legacy,
      `legacy-format content image(s) — convert to webp/avif (sharp is already a dependency):\n${legacy.join('\n')}`,
    ).toEqual([]);
  });

  it('render-path content images ship as AVIF — webp only with a documented compat reason', () => {
    // Ratchet (2026-07): AVIF measured 16–55% smaller than the webp files it
    // replaced (sharp, quality 60–70, effort 9 — e.g. spacex logo 45KB→23KB,
    // hero 15KB→9KB), with universal evergreen-browser support (Safari ≥16.4).
    // Everything the page actually renders ships AVIF; webp survives only
    // where a non-browser consumer still needs it, each with a reason on
    // record (same policy as the PNG icon/social-card exemption above).
    const AVIF_EXEMPT_WEBP: Record<string, string> = {
      'images/profile.webp':
        'Referenced by manifest.json icons and the structured-data/profile image URL — scraper/PWA-installer ' +
        'compat (same reasoning as PNG social cards); also the sharp source generate-icons.mjs derives from.',
      'logos/ba.webp':
        'Generation source only (generate-icons.mjs derives ba-logo.avif from it) — never fetched by the page.',
    };
    const legacyWebp: string[] = [];
    for (const file of files) {
      if (!/\.webp$/i.test(file.rel)) continue;
      if (file.rel in AVIF_EXEMPT_WEBP) continue;
      legacyWebp.push(`  public/${file.rel}`);
    }
    expect(
      legacyWebp,
      `webp content image(s) on the render path — convert to avif (sharp is already a dependency) ` +
        `or add a reasoned AVIF_EXEMPT_WEBP entry:\n${legacyWebp.join('\n')}`,
    ).toEqual([]);
    // Exemption hygiene: entries must name real files (no stale exemptions).
    const byRel = new Set(files.map((file) => file.rel));
    for (const [rel, reason] of Object.entries(AVIF_EXEMPT_WEBP)) {
      expect(reason.length, `AVIF_EXEMPT_WEBP["${rel}"] needs a real reason`).toBeGreaterThan(10);
      expect(byRel.has(rel), `AVIF_EXEMPT_WEBP["${rel}"] names a file that no longer exists — delete the entry`).toBe(
        true,
      );
    }
  });

});
