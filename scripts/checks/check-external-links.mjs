#!/usr/bin/env node
/**
 * Extracts every external (non-cameronaaron.com) URL referenced from
 * src/data/*.ts and writes/refreshes a checked-in ledger
 * (scripts/checks/external-links-ledger.json) recording each URL's live
 * status.
 *
 * Why a ledger instead of checking the network on every commit: third-party
 * sites (LinkedIn, ResearchGate, small institutional pages) are far less
 * reliable and far more rate-limit-prone than the npm/GitHub APIs the
 * dependency-freshness contracts hit — checking ~90 of them on every commit
 * would make the gate flaky and would hammer sites that don't expect it.
 * Instead: this script runs periodically (a developer runs `pnpm run
 * check:links`, or a scheduled job does), updates the ledger, and commits
 * it. src/external-links-contract.test.ts is the FAST, OFFLINE, pre-commit
 * gate — it reads the ledger and fails on any DEAD entry or one that's
 * drifted stale, but never touches the network itself.
 *
 * A non-200 response isn't automatically "dead": major platforms
 * (LinkedIn, ResearchGate, Facebook, dutchie.com, doi.org's redirect
 * target) block scripted requests with 403/429/400/999 even though the
 * page is genuinely live in a real browser. BOT_BLOCKING_HOSTS lists hosts
 * where a non-200 is classified 'blocked' (assumed live, flagged for a
 * human to spot-check occasionally) rather than 'dead'. Only 404/410/5xx/
 * DNS-failure/timeout counts as 'dead'.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const DATA_DIR = join(ROOT, 'src', 'data');
// Lives next to this script, not in src/data/ — that directory's hygiene
// contract requires every file be hand-written camelCase .ts source, and
// this is a generated JSON artifact, not site content.
const LEDGER_PATH = join(import.meta.dirname, 'external-links-ledger.json');

const URL_PATTERN = /https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** Hosts known to block scripted requests even when the page is genuinely
 *  live — a non-200 here is 'blocked', not 'dead'. */
const BOT_BLOCKING_HOSTS = [
  'linkedin.com',
  'facebook.com',
  'researchgate.net',
  'dutchie.com',
  'arvojournals.org', // doi.org/10.1167/... redirects here
];

function extractExternalUrls() {
  const urls = new Map(); // url -> Set<relative file path>
  const walk = (dir) => {
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
        urls.get(url).add(rel);
      }
    }
  };
  walk(DATA_DIR);
  return urls;
}

function classify(status, hostname) {
  if (status >= 200 && status < 400) return 'live';
  if (BOT_BLOCKING_HOSTS.some((host) => hostname.endsWith(host))) return 'blocked';
  return 'dead';
}

async function checkUrl(url, { retries = 2, timeoutMs = 15_000 } = {}) {
  let lastError = 'unknown error';

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' },
      });
      clearTimeout(timer);
      // Classify by the FINAL (post-redirect) hostname — doi.org redirects
      // to arvojournals.org before returning its bot-blocking 403, so
      // checking the original host would misclassify a live, redirecting
      // DOI as dead.
      const finalHostname = new URL(response.url || url).hostname;
      return {
        status: classify(response.status, finalHostname),
        httpCode: response.status,
        finalUrl: response.url,
      };
    } catch (error) {
      clearTimeout(timer);
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return { status: 'dead', httpCode: 0, finalUrl: url, error: lastError };
}

function loadLedger() {
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function main() {
  const args = process.argv.slice(2);
  const onlyStale = args.includes('--stale-only');
  const staleDays = 30;

  const found = extractExternalUrls();
  const ledger = loadLedger();
  const now = new Date().toISOString();
  const results = {};
  const deadNow = [];

  const urlList = [...found.keys()].sort();
  console.log(`Checking ${urlList.length} external URL(s) referenced from src/data/...`);

  let checked = 0;
  for (const url of urlList) {
    const existing = ledger[url];
    const ageDays = existing ? (Date.now() - new Date(existing.lastChecked).getTime()) / 86_400_000 : Infinity;

    if (onlyStale && existing && ageDays < staleDays) {
      results[url] = { ...existing, files: [...found.get(url)].sort() };
      continue;
    }

    checked += 1;
    const outcome = await checkUrl(url);
    results[url] = {
      status: outcome.status,
      httpCode: outcome.httpCode,
      lastChecked: now,
      files: [...found.get(url)].sort(),
    };
    if (outcome.status === 'dead') deadNow.push(`  ${url}  (${outcome.httpCode || outcome.error})\n    in: ${[...found.get(url)].join(', ')}`);
    console.log(`  ${outcome.status.padEnd(7)} ${outcome.httpCode || '---'}  ${url}`);
  }

  writeFileSync(LEDGER_PATH, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`\nChecked ${checked}/${urlList.length} URL(s) (${urlList.length - checked} skipped, within ${staleDays}d). Ledger written to ${LEDGER_PATH.replace(`${ROOT}/`, '')}.`);

  if (deadNow.length > 0) {
    console.error(`\n${deadNow.length} dead link(s) found:\n${deadNow.join('\n')}`);
    process.exitCode = 1;
  }
}

main();
