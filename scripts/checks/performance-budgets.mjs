import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const outDir = resolve(root, 'out');

const requiredOutputFiles = [
  'index.html',
  'capstone.html',
  'credentials.html',
  'internet.html',
  'sw.js',
];

// Recalibrated 2026-07 with real data (ENGINEERING-STANDARDS.md §4.7 pattern:
// adjust with a measured baseline, not a guess) — the home page's content
// (certifications, education, testimonials, structured data) has grown
// enough that the prior thresholds started failing on a clean build with no
// bug behind it. A fresh `npm run build` measured: home HTML 523,233B raw /
// 61,900B gzip, total HTML 1,113,927B raw / 195,084B gzip, total JS
// 1,043,608B raw / 321,400B gzip. New ceilings give ~15-18% headroom over
// that baseline, not unlimited room — a real regression still trips this.
//
// Recalibrated again 2026-07-18: the new /nursing page (a real, distinct
// route, not a bug) added an 8th HTML output file. A fresh `npm run build`
// measured total HTML 1,249,562B raw / 223,892B gzip across all 8 pages —
// raw was still just inside the old 1,300,000 ceiling (96% used, no headroom
// left for the next page or content addition) and gzip had already crossed
// the old 220,000 ceiling. Both ceilings below carry ~16% headroom over this
// baseline. Per-page (home/single) budgets were untouched — home HTML
// (534,925B raw / 63,721B gzip) and the largest single page still sit
// comfortably under their existing ceilings; this was a total-across-pages
// problem, not a per-page one.
// Recalibrated again 2026-07-23, root-caused to the RSC islands migration
// (§5): converting page.tsx + Education/Footer/Certifications to Server
// Components moved their markup out of hydrated client JS and into the HTML
// document itself — a deliberate trade (zero hydration cost for those
// sections) whose HTML side crossed the old per-page ceilings on a clean
// build: home 670,981B raw / 73,680B gzip vs 620,000/72,000 caps. Nothing
// flagged it for five days because this script only ran pre-manual-deploy
// while pushes auto-deploy — that hole is now closed (pre-push builds and
// runs this script; see package.json simple-git-hooks). New per-page
// ceilings carry ~5% headroom over the measured baseline: tight enough that
// the next real regression trips, loose enough that content edits don't.
// Known recoverable slack, parked in ENGINEERING-STANDARDS §9.4: the 33KB
// JSON-LD block ships twice (once as ld+json, once RSC-flight-escaped).
const budgets = {
  homeHtmlBytes: 705_000,
  homeHtmlGzipBytes: 77_500,
  singleHtmlBytes: 705_000,
  singleHtmlGzipBytes: 77_500,
  totalHtmlBytes: 1_450_000,
  totalHtmlGzipBytes: 260_000,
  singleJsBytes: 320_000,
  singleJsGzipBytes: 95_000,
  totalJsBytes: 1_200_000,
  totalJsGzipBytes: 370_000,
  singleCssBytes: 130_000,
  singleCssGzipBytes: 20_000,
  totalCssBytes: 150_000,
  totalCssGzipBytes: 30_000,
  singleImageBytes: 300_000,
  totalImageBytes: 800_000,
  serviceWorkerBytes: 12_000,
};

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.avif']);

// Next's own next/dist/build/polyfills/polyfill-module.js ships unconditionally
// to every browser regardless of the browserslist target (vercel/next.js#86785)
// — worked around via `pnpm patch` (patches/next@*.patch), which empties that
// file at the source, so the bundler has nothing to inline. This fingerprint
// is the exact literal source of the `String.trimStart` shim from that file;
// it doesn't appear in application code or in real third-party polyfill
// libraries (e.g. core-js implements trimStart differently), so a match here
// means the patch silently stopped applying — most likely because a `next`
// version bump left `patchedDependencies` pointing at a version that's no
// longer installed. Scoped to non-`noModule` scripts only; the `noModule`
// chunk is patched to zero bytes and guarded separately below (a pre-ES-module
// browser can't parse this site's ES2017+ chunks anyway, so its polyfills
// defended a runtime that could never start — see ENGINEERING-STANDARDS §9.2).
const LEGACY_POLYFILL_FINGERPRINT = '"trimStart"in String.prototype||(String.prototype.trimStart=String.prototype.trimLeft)';

function findModernScriptChunks(htmlFiles) {
  const chunks = new Set();
  const scriptTagPattern = /<script\b[^>]*>/gi;
  const srcPattern = /\bsrc="([^"]+)"/;

  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, 'utf8');
    for (const tag of html.matchAll(scriptTagPattern)) {
      const [tagText] = tag;
      if (/\bnoModule\b/i.test(tagText)) continue;
      const srcMatch = srcPattern.exec(tagText);
      if (srcMatch && srcMatch[1].startsWith('/_next/static/chunks/')) {
        chunks.add(srcMatch[1]);
      }
    }
  }

  return chunks;
}

function walkFiles(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function summarizeTextAssets(files) {
  let totalBytes = 0;
  let totalGzipBytes = 0;
  let maxBytes = 0;
  let maxGzipBytes = 0;
  let maxFile = '';
  let maxGzipFile = '';

  for (const file of files) {
    const buffer = readFileSync(file);
    const size = buffer.length;
    const gzipSize = gzipSync(buffer, { level: 9 }).length;

    totalBytes += size;
    totalGzipBytes += gzipSize;

    if (size > maxBytes) {
      maxBytes = size;
      maxFile = file;
    }

    if (gzipSize > maxGzipBytes) {
      maxGzipBytes = gzipSize;
      maxGzipFile = file;
    }
  }

  return {
    totalBytes,
    totalGzipBytes,
    maxBytes,
    maxGzipBytes,
    maxFile,
    maxGzipFile,
  };
}

function summarizeBinaryAssets(files) {
  let totalBytes = 0;
  let maxBytes = 0;
  let maxFile = '';

  for (const file of files) {
    const size = statSync(file).size;
    totalBytes += size;

    if (size > maxBytes) {
      maxBytes = size;
      maxFile = file;
    }
  }

  return {
    totalBytes,
    maxBytes,
    maxFile,
  };
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString()} bytes`;
}

function pushBudgetError(errors, label, actual, limit, filePath = '') {
  const suffix = filePath ? ` (${relative(root, filePath)})` : '';
  errors.push(`${label}${suffix}: ${formatBytes(actual)} exceeds ${formatBytes(limit)}`);
}

if (!existsSync(outDir)) {
  console.error('Performance budget checks failed:');
  console.error('- Build output directory "out" not found. Run "npm run build" first.');
  process.exit(1);
}

const errors = [];

for (const relativePath of requiredOutputFiles) {
  const absolutePath = resolve(outDir, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`Required output file is missing: out/${relativePath}`);
  }
}

const allOutFiles = walkFiles(outDir);

const htmlFiles = allOutFiles.filter((file) => file.endsWith('.html'));
const jsFiles = allOutFiles.filter((file) => file.endsWith('.js'));
const cssFiles = allOutFiles.filter((file) => file.endsWith('.css'));
const imageFiles = allOutFiles.filter((file) => imageExtensions.has(extname(file).toLowerCase()));

const htmlMetrics = summarizeTextAssets(htmlFiles);
const jsMetrics = summarizeTextAssets(jsFiles);
const cssMetrics = summarizeTextAssets(cssFiles);
const imageMetrics = summarizeBinaryAssets(imageFiles);

const homeHtmlPath = resolve(outDir, 'index.html');
if (existsSync(homeHtmlPath)) {
  const homeHtmlBuffer = readFileSync(homeHtmlPath);
  const homeHtmlBytes = homeHtmlBuffer.length;
  const homeHtmlGzipBytes = gzipSync(homeHtmlBuffer, { level: 9 }).length;

  if (homeHtmlBytes > budgets.homeHtmlBytes) {
    pushBudgetError(errors, 'Home HTML raw size', homeHtmlBytes, budgets.homeHtmlBytes, homeHtmlPath);
  }

  if (homeHtmlGzipBytes > budgets.homeHtmlGzipBytes) {
    pushBudgetError(errors, 'Home HTML gzip size', homeHtmlGzipBytes, budgets.homeHtmlGzipBytes, homeHtmlPath);
  }
}

if (htmlMetrics.maxBytes > budgets.singleHtmlBytes) {
  pushBudgetError(errors, 'Largest HTML raw size', htmlMetrics.maxBytes, budgets.singleHtmlBytes, htmlMetrics.maxFile);
}

if (htmlMetrics.maxGzipBytes > budgets.singleHtmlGzipBytes) {
  pushBudgetError(errors, 'Largest HTML gzip size', htmlMetrics.maxGzipBytes, budgets.singleHtmlGzipBytes, htmlMetrics.maxGzipFile);
}

if (htmlMetrics.totalBytes > budgets.totalHtmlBytes) {
  pushBudgetError(errors, 'Total HTML raw size', htmlMetrics.totalBytes, budgets.totalHtmlBytes);
}

if (htmlMetrics.totalGzipBytes > budgets.totalHtmlGzipBytes) {
  pushBudgetError(errors, 'Total HTML gzip size', htmlMetrics.totalGzipBytes, budgets.totalHtmlGzipBytes);
}

if (jsMetrics.maxBytes > budgets.singleJsBytes) {
  pushBudgetError(errors, 'Largest JS raw size', jsMetrics.maxBytes, budgets.singleJsBytes, jsMetrics.maxFile);
}

if (jsMetrics.maxGzipBytes > budgets.singleJsGzipBytes) {
  pushBudgetError(errors, 'Largest JS gzip size', jsMetrics.maxGzipBytes, budgets.singleJsGzipBytes, jsMetrics.maxGzipFile);
}

if (jsMetrics.totalBytes > budgets.totalJsBytes) {
  pushBudgetError(errors, 'Total JS raw size', jsMetrics.totalBytes, budgets.totalJsBytes);
}

if (jsMetrics.totalGzipBytes > budgets.totalJsGzipBytes) {
  pushBudgetError(errors, 'Total JS gzip size', jsMetrics.totalGzipBytes, budgets.totalJsGzipBytes);
}

if (cssMetrics.maxBytes > budgets.singleCssBytes) {
  pushBudgetError(errors, 'Largest CSS raw size', cssMetrics.maxBytes, budgets.singleCssBytes, cssMetrics.maxFile);
}

if (cssMetrics.maxGzipBytes > budgets.singleCssGzipBytes) {
  pushBudgetError(errors, 'Largest CSS gzip size', cssMetrics.maxGzipBytes, budgets.singleCssGzipBytes, cssMetrics.maxGzipFile);
}

if (cssMetrics.totalBytes > budgets.totalCssBytes) {
  pushBudgetError(errors, 'Total CSS raw size', cssMetrics.totalBytes, budgets.totalCssBytes);
}

if (cssMetrics.totalGzipBytes > budgets.totalCssGzipBytes) {
  pushBudgetError(errors, 'Total CSS gzip size', cssMetrics.totalGzipBytes, budgets.totalCssGzipBytes);
}

if (imageMetrics.maxBytes > budgets.singleImageBytes) {
  pushBudgetError(errors, 'Largest image size', imageMetrics.maxBytes, budgets.singleImageBytes, imageMetrics.maxFile);
}

if (imageMetrics.totalBytes > budgets.totalImageBytes) {
  pushBudgetError(errors, 'Total image size', imageMetrics.totalBytes, budgets.totalImageBytes);
}

const modernScriptChunks = findModernScriptChunks(htmlFiles);
for (const chunkSrc of modernScriptChunks) {
  const chunkPath = resolve(outDir, chunkSrc.replace(/^\//, ''));
  if (!existsSync(chunkPath)) continue;
  const chunkContent = readFileSync(chunkPath, 'utf8');
  if (chunkContent.includes(LEGACY_POLYFILL_FINGERPRINT)) {
    errors.push(
      `Legacy polyfill shipped to modern browsers: ${chunkSrc} contains Next's unconditional ` +
        `polyfill-module.js (vercel/next.js#86785). The pnpm patch (patches/next@*.patch) that ` +
        `strips it has stopped applying — check "next"'s resolved version against ` +
        `pnpm-workspace.yaml's patchedDependencies key and re-run "pnpm patch next@<version>".`,
    );
  }
}

// §9.1 shipped-artifact checks: these assert what the build EMITTED, not what
// the source intended. Each exists because intent and emission disagreed once:
// next/image's `priority` prop emits no fetchpriority under `unoptimized`
// static export, and a `next` bump can silently drop the patch that empties
// the 112KB noModule legacy bundle.
if (existsSync(homeHtmlPath)) {
  const homeHtml = readFileSync(homeHtmlPath, 'utf8');

  if (!/<img[^>]*fetchPriority="high"[^>]*profile-hero|<img[^>]*profile-hero[^>]*fetchPriority="high"/i.test(homeHtml)) {
    errors.push(
      'LCP priority lost: out/index.html has no fetchpriority="high" on the hero profile image — ' +
        'the LCP image is queueing at default priority behind the async-script wave. ' +
        'ProfileImage.tsx must pass fetchPriority explicitly (next/image `priority` alone does not emit it here).',
    );
  }

  if (!/<script type="speculationrules">[^<]*"prefetch"/.test(homeHtml) || !/<script type="speculationrules">[^<]*"prerender"/.test(homeHtml)) {
    errors.push(
      'Speculation Rules missing from out/index.html — instant subpage navigation is off. ' +
        'The root layout must render SPECULATION_RULES (src/data/metadata.ts) as a type="speculationrules" script.',
    );
  }

  for (const tag of homeHtml.matchAll(/<script\b[^>]*>/gi)) {
    if (!/\bnoModule\b/i.test(tag[0])) continue;
    const srcMatch = /\bsrc="([^"]+)"/.exec(tag[0]);
    if (!srcMatch) continue;
    const noModulePath = resolve(outDir, srcMatch[1].replace(/^\//, ''));
    if (existsSync(noModulePath) && statSync(noModulePath).size > 0) {
      errors.push(
        `noModule legacy bundle came back: ${srcMatch[1]} is ${statSync(noModulePath).size} bytes (expected 0). ` +
          `The pnpm patch emptying polyfill-nomodule.js stopped applying — re-cut it for the installed next version.`,
      );
    }
  }
}

const serviceWorkerPath = resolve(outDir, 'sw.js');
if (existsSync(serviceWorkerPath)) {
  const serviceWorkerBytes = statSync(serviceWorkerPath).size;
  if (serviceWorkerBytes > budgets.serviceWorkerBytes) {
    pushBudgetError(errors, 'Service worker size', serviceWorkerBytes, budgets.serviceWorkerBytes, serviceWorkerPath);
  }
}

if (errors.length > 0) {
  console.error('Performance budget checks failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Performance budget checks passed.');
console.log(`- HTML total: ${formatBytes(htmlMetrics.totalBytes)} (gzip ${formatBytes(htmlMetrics.totalGzipBytes)})`);
console.log(`- JS total: ${formatBytes(jsMetrics.totalBytes)} (gzip ${formatBytes(jsMetrics.totalGzipBytes)})`);
console.log(`- CSS total: ${formatBytes(cssMetrics.totalBytes)} (gzip ${formatBytes(cssMetrics.totalGzipBytes)})`);
console.log(`- Images total: ${formatBytes(imageMetrics.totalBytes)}`);
