/**
 * External links contract.
 *
 * 2026-07: a reader reported the Delta Epsilon Tau International Honor
 * Society link went to a dead page. Auditing every external URL referenced
 * from src/data found four dead links total (Delta Epsilon Tau's own domain
 * had lapsed; Connecticut College's Ammerman Center sub-page was removed in
 * a site restructure — one of its two occurrences silently survived an
 * earlier "replace all" edit, caught only by re-running the checker script
 * rather than trusting the edit's own success claim; CIHE rebranded to
 * NECHE and the old accreditor domain now 404s; a defunct 2020 COVID
 * project's site went fully dark, fixed to a Wayback Machine capture) —
 * with nothing watching for any of it.
 *
 * This is the fast, OFFLINE half of the fix (runs in the mandatory
 * pre-commit gate): it reads the checked-in ledger
 * (scripts/checks/external-links-ledger.json) and fails on any entry marked dead,
 * any URL in src/data missing from the ledger (a new link added without
 * running the checker), any ledger entry for a URL no longer referenced
 * anywhere (self-cleaning, same policy as every allowlist in this repo),
 * and any ledger entry old enough that its liveness can no longer be
 * trusted. It never touches the network itself.
 *
 * The slow, NETWORKED half is scripts/checks/check-external-links.mjs
 * (`pnpm run check:links`) — run it periodically to refresh the ledger.
 * Third-party sites are far less reliable than the npm/GitHub APIs the
 * dependency-freshness contracts hit, so unlike those, this doesn't run on
 * every commit; it runs on a ledger cadence instead. Bot-blocking platforms
 * (LinkedIn, ResearchGate, Facebook, dutchie.com, arXiv/DOI redirect
 * targets) are classified 'blocked', not 'dead' — a non-200 there doesn't
 * fail the gate, but IS worth an occasional human glance.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const DATA_DIR = join(ROOT, 'src', 'data');
// Lives next to the generator script, not in src/data/ — that directory's
// hygiene contract requires every file be hand-written camelCase .ts
// source, and this is a generated JSON artifact.
const LEDGER_PATH = join(ROOT, 'scripts', 'checks', 'external-links-ledger.json');

const URL_PATTERN = /https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g;
const MAX_LEDGER_AGE_DAYS = 45;

interface LedgerEntry {
  status: 'live' | 'blocked' | 'dead';
  httpCode: number;
  lastChecked: string;
  files: string[];
}

function extractExternalUrls(): Map<string, Set<string>> {
  const urls = new Map<string, Set<string>>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name) || entry.name.includes('.test.')) continue;

      const text = readFileSync(full, 'utf8');
      for (const match of text.matchAll(URL_PATTERN)) {
        const url = match[0].replace(/[.,;'"`)]+$/, '');
        if (url.includes('cameronaaron.com')) continue;
        if (url.includes('${') || url.includes('localhost') || url.includes('127.0.0.1')) continue;
        if (url.includes('schema.org') || url.includes('w3.org')) continue;

        const rel = full.replace(`${ROOT}/`, '');
        if (!urls.has(url)) urls.set(url, new Set());
        urls.get(url)!.add(rel);
      }
    }
  };
  walk(DATA_DIR);
  return urls;
}

describe('external-links-contract — every external URL is verified live', () => {
  const liveUrls = extractExternalUrls();
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as Record<string, LedgerEntry>;

  it('the ledger has an entry for every external URL currently referenced from src/data', () => {
    const missing = [...liveUrls.keys()].filter((url) => !(url in ledger));
    expect(
      missing,
      `${missing.length} URL(s) added without running the link checker — run "pnpm run check:links":\n${missing.map((u) => `  ${u}`).join('\n')}`,
    ).toEqual([]);
  });

  it('no ledger entry is orphaned — every entry still corresponds to a real reference', () => {
    // Same self-cleaning policy as every allowlist in this repo: a stale
    // entry for a URL nobody references anymore is dead weight that should
    // be deleted, not left to rot.
    const orphaned = Object.keys(ledger).filter((url) => !liveUrls.has(url));
    expect(
      orphaned,
      `${orphaned.length} ledger entr(y/ies) reference a URL no longer used anywhere — re-run "pnpm run check:links" to prune:\n${orphaned.map((u) => `  ${u}`).join('\n')}`,
    ).toEqual([]);
  });

  it('no external URL is marked dead', () => {
    const dead = Object.entries(ledger)
      .filter(([, entry]) => entry.status === 'dead')
      .map(([url, entry]) => `  ${url}  (${entry.httpCode})\n    in: ${entry.files.join(', ')}`);

    expect(
      dead,
      `${dead.length} dead external link(s) — fix the URL in its source file, then re-run "pnpm run check:links":\n${dead.join('\n')}`,
    ).toEqual([]);
  });

  it(`every ledger entry was verified within the last ${MAX_LEDGER_AGE_DAYS} days`, () => {
    const now = Date.now();
    const stale = Object.entries(ledger)
      .filter(([, entry]) => {
        const ageDays = (now - new Date(entry.lastChecked).getTime()) / 86_400_000;
        return ageDays > MAX_LEDGER_AGE_DAYS;
      })
      .map(([url, entry]) => `  ${url} (last checked ${entry.lastChecked})`);

    expect(
      stale,
      `${stale.length} link(s) haven't been re-verified in ${MAX_LEDGER_AGE_DAYS}+ days — run "pnpm run check:links" to refresh:\n${stale.join('\n')}`,
    ).toEqual([]);
  });

  it('every URL in src/data uses https, never http', () => {
    const insecure = [...liveUrls.keys()].filter((url) => url.startsWith('http://'));
    expect(
      insecure,
      `http:// URL(s) — use https:// (verify the host supports it first):\n${insecure.map((u) => `  ${u}`).join('\n')}`,
    ).toEqual([]);
  });
});
