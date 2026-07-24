/**
 * Public asset weight contract.
 *
 * Mobile LCP lives and dies on asset weight: one oversized image dropped into
 * public/ can regress the Lighthouse mobile gate (0.95) weeks later with
 * nothing watching — the same "ecosystem nothing is watching" failure mode the
 * dependency/GitHub-Actions freshness contracts exist to close, applied to
 * binary assets git happily accepts at any size.
 *
 * Three budgets, all enforced per commit:
 *   1. Every image ≤ MAX_IMAGE_BYTES  — images ship to every visitor; the
 *      largest today (icon-512, ~132 KB) fits comfortably.
 *   2. Every file  ≤ MAX_FILE_BYTES   — catches PDFs/fonts/videos too.
 *   3. public/ in total ≤ TOTAL_BUDGET_BYTES — prevents slow accretion that
 *      no single file trips.
 *
 * Deliberate exceptions go in WEIGHT_EXEMPT with a reason — a decision on
 * record, not a loophole (same policy as PUBLIC_CONVENTION_EXEMPT /
 * ALLOWED_UNUSED_COMPONENTS). An exempt file still counts toward the total.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PUBLIC_DIR = resolve(process.cwd(), 'public');

export const MAX_IMAGE_BYTES = 200 * 1024;
export const MAX_FILE_BYTES = 400 * 1024;
export const TOTAL_BUDGET_BYTES = 1536 * 1024;

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i;

/** rel-path → reason. Exempt from per-file caps only; still counts in total. */
const WEIGHT_EXEMPT: Record<string, string> = {};

function listPublicFiles(): Array<{ rel: string; bytes: number }> {
  const files: Array<{ rel: string; bytes: number }> = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push({ rel: relative(PUBLIC_DIR, full), bytes: statSync(full).size });
    }
  };
  walk(PUBLIC_DIR);
  return files;
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

describe('public-asset-weight-contract — mobile LCP budget', () => {
  const files = listPublicFiles();

  it('every image is within the image budget', () => {
    const over: string[] = [];
    for (const file of files) {
      if (!(file.rel in WEIGHT_EXEMPT) && IMAGE_EXTENSIONS.test(file.rel) && file.bytes > MAX_IMAGE_BYTES) {
        over.push(`  public/${file.rel}: ${kb(file.bytes)} > ${kb(MAX_IMAGE_BYTES)}`);
      }
    }
    expect(
      over,
      `${over.length} oversized image(s) — compress (webp/avif), resize, or add a reasoned WEIGHT_EXEMPT entry:\n${over.join('\n')}`,
    ).toEqual([]);
  });

  it('every file is within the per-file budget', () => {
    const over: string[] = [];
    for (const file of files) {
      if (!(file.rel in WEIGHT_EXEMPT) && file.bytes > MAX_FILE_BYTES) {
        over.push(`  public/${file.rel}: ${kb(file.bytes)} > ${kb(MAX_FILE_BYTES)}`);
      }
    }
    expect(
      over,
      `${over.length} oversized file(s) — shrink or add a reasoned WEIGHT_EXEMPT entry:\n${over.join('\n')}`,
    ).toEqual([]);
  });

  it('public/ stays within the total weight budget', () => {
    let total = 0;
    for (const file of files) total += file.bytes;
    expect(
      total,
      `public/ totals ${kb(total)} — budget is ${kb(TOTAL_BUDGET_BYTES)}; remove or compress assets (largest first)`,
    ).toBeLessThanOrEqual(TOTAL_BUDGET_BYTES);
  });

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

  it('every WEIGHT_EXEMPT entry names a file that still exists and still needs the exemption', () => {
    const byRel = new Map(files.map((file) => [file.rel, file.bytes]));
    for (const [rel, reason] of Object.entries(WEIGHT_EXEMPT)) {
      expect(reason.length, `WEIGHT_EXEMPT["${rel}"] needs a real reason`).toBeGreaterThan(10);
      const bytes = byRel.get(rel);
      expect(bytes, `WEIGHT_EXEMPT["${rel}"] names a file that no longer exists — delete the entry`).toBeDefined();
      const cap = IMAGE_EXTENSIONS.test(rel) ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
      expect(
        (bytes ?? 0) > cap,
        `WEIGHT_EXEMPT["${rel}"] is no longer over budget — delete the entry`,
      ).toBe(true);
    }
  });
});
