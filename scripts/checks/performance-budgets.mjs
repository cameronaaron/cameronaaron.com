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
  'bridging-transitions.html',
  'sw.js',
];

// Asset sizes are informational by owner decision (September 2026).
// This script retains its command path for hook/CI compatibility. Only build
// integrity failures block release; design choices have no fixed byte ceiling.

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

if (!existsSync(outDir)) {
  console.error('Build integrity checks failed:');
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

if (errors.length > 0) {
  console.error('Build integrity checks failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Build integrity checks passed.');
console.log('Asset sizes (informational; no byte limits):');
console.log(`- HTML total: ${formatBytes(htmlMetrics.totalBytes)} (gzip ${formatBytes(htmlMetrics.totalGzipBytes)})`);
console.log(`- JS total: ${formatBytes(jsMetrics.totalBytes)} (gzip ${formatBytes(jsMetrics.totalGzipBytes)})`);
console.log(`- CSS total: ${formatBytes(cssMetrics.totalBytes)} (gzip ${formatBytes(cssMetrics.totalGzipBytes)})`);
console.log(`- Images total: ${formatBytes(imageMetrics.totalBytes)}`);

for (const [label, metrics] of [['HTML', htmlMetrics], ['JS', jsMetrics], ['CSS', cssMetrics]]) {
  console.log(`- Largest ${label}: ${formatBytes(metrics.maxBytes)} (${relative(root, metrics.maxFile)}); largest gzip ${formatBytes(metrics.maxGzipBytes)} (${relative(root, metrics.maxGzipFile)})`);
}
console.log(`- Largest image: ${formatBytes(imageMetrics.maxBytes)} (${relative(root, imageMetrics.maxFile)})`);
console.log(`- Home HTML: ${formatBytes(statSync(homeHtmlPath).size)} (gzip ${formatBytes(gzipSync(readFileSync(homeHtmlPath), { level: 9 }).length)})`);
console.log(`- Service worker: ${formatBytes(statSync(resolve(outDir, 'sw.js')).size)}`);
const publicDir = resolve(root, 'public');
if (existsSync(publicDir)) {
  const publicMetrics = summarizeBinaryAssets(walkFiles(publicDir));
  console.log(`- Public files total: ${formatBytes(publicMetrics.totalBytes)}; largest ${formatBytes(publicMetrics.maxBytes)} (${relative(root, publicMetrics.maxFile)})`);
}
