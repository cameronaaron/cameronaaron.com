/**
 * Poster artifact contract.
 *
 * 2026-09-06: /bridging-transitions shipped serving a copy of the SNS26
 * poster PDF that had been taken from the poster repo at one moment in time.
 * That repo moved on, and the served copy quietly became a poster whose
 * printed QR code pointed at the site ROOT — someone who downloaded the
 * poster from the landing page got a poster that led back to the homepage
 * instead of to the page they were standing on. Nothing caught it: the bytes
 * are opaque, the page rendered fine, every test passed. It was found by
 * decoding the file by hand.
 *
 * The property that must hold is inside the file: a poster served at
 * /bridging-transitions must carry a QR code that resolves to
 * /bridging-transitions. Checking it means actually decoding the code, which
 * needs a rasteriser and a QR reader — the same shape of problem as external
 * link liveness, and it gets the same two-part solution:
 *
 *   - `pnpm run check:poster` (scripts/checks/verify-poster-artifacts.mjs)
 *     does the real work: rasterises each PDF, decodes its QR, writes the
 *     ledger. Needs pdftoppm + zbarimg, so it is not gate material.
 *   - This contract is the fast OFFLINE half that runs on every commit. It
 *     never opens a PDF's contents; it checks that the bytes on disk still
 *     match the bytes that were verified, and that what was decoded from them
 *     is the canonical page URL.
 *
 * The consequence that matters: swapping a poster PDF changes its sha256,
 * which fails this contract until `check:poster` is re-run — and re-running it
 * re-decodes the QR, so a poster pointing at the wrong place cannot get past
 * the gate quietly. Text extraction is deliberately not used: Typst subsets
 * its fonts, so the URL is not present as plain text in the PDF's content
 * streams (verified — 18 inflated streams, zero containing the literal path).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { getPageUrl } from '@/data/site';

const ROOT = resolve(process.cwd());
const POSTER_DIR = join(ROOT, 'public', 'poster');
const LEDGER_PATH = join(ROOT, 'scripts', 'checks', 'poster-artifact-ledger.json');

/** The page these artifacts are served from, and therefore the only address
 *  their QR codes may resolve to. Derived from SITE_URL, never hardcoded. */
const CANONICAL_TARGET = getPageUrl('/bridging-transitions');

interface PosterLedgerEntry {
  sha256: string;
  bytes: number;
  qrTargets: string[];
  lastVerified: string;
}

const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as Record<string, PosterLedgerEntry>;
const posterFiles = readdirSync(POSTER_DIR)
  .filter((name) => name.endsWith('.pdf'))
  .sort();

const sha256Of = (name: string) =>
  createHash('sha256').update(readFileSync(join(POSTER_DIR, name))).digest('hex');

describe('poster-artifact-contract — every served poster points back at its own page', () => {
  it('public/poster/ actually holds the PDFs the landing page links to', () => {
    // Guard the guard (§6 item 8): an empty directory would make every
    // per-file check below vacuously pass.
    expect(posterFiles.length, 'public/poster/ has no PDFs to verify').toBeGreaterThan(0);
  });

  it('the ledger has an entry for every served poster PDF', () => {
    const missing = posterFiles.filter((name) => !(name in ledger));
    expect(
      missing,
      `${missing.length} poster PDF(s) added or replaced without verification — run "pnpm run check:poster":\n${missing.map((n) => `  ${n}`).join('\n')}`,
    ).toEqual([]);
  });

  it('no ledger entry is orphaned — every entry still names a served file', () => {
    // Same self-cleaning policy as every other ledger and allowlist here.
    const present = new Set(posterFiles);
    const orphaned = Object.keys(ledger).filter((name) => !present.has(name));
    expect(
      orphaned,
      `${orphaned.length} ledger entr(y/ies) name a PDF no longer in public/poster/ — re-run "pnpm run check:poster" to prune:\n${orphaned.map((n) => `  ${n}`).join('\n')}`,
    ).toEqual([]);
  });

  it.each(posterFiles)('%s still has the exact bytes that were verified', (name) => {
    const entry = ledger[name];
    expect(entry, `${name} has no ledger entry`).toBeTruthy();
    expect(
      sha256Of(name),
      `${name} changed since its QR code was last decoded. Re-run "pnpm run check:poster" — ` +
        'a replaced poster is exactly how the served file once ended up pointing at the site root.',
    ).toBe(entry.sha256);
  });

  it.each(posterFiles)('%s carries a QR code aimed at its own landing page', (name) => {
    const entry = ledger[name];

    expect(entry.qrTargets.length, `${name} has no decoded QR target on record`).toBeGreaterThan(0);
    for (const target of entry.qrTargets) {
      expect(
        target,
        `${name}'s QR code resolves to ${target}, not to the page that serves it. ` +
          'Rebuild the poster from cameronaaron/bridging-transitions-poster with the corrected ' +
          'qr.url, then re-run "pnpm run check:poster".',
      ).toBe(CANONICAL_TARGET);
    }
  });

  it('the recorded byte counts match the files on disk', () => {
    // Cheap independent cross-check of the sha: a ledger hand-edited to make
    // the hash line up would still have to get this right too.
    for (const name of posterFiles) {
      expect(readFileSync(join(POSTER_DIR, name)).length, `${name} size disagrees with the ledger`).toBe(
        ledger[name].bytes,
      );
    }
  });

  it('every entry records when it was verified, in ISO date form', () => {
    for (const [name, entry] of Object.entries(ledger)) {
      expect(entry.lastVerified, `${name} has no lastVerified date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
