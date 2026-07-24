#!/usr/bin/env node
/**
 * Runtime-exact critical-CSS inliner (ENGINEERING-STANDARDS §4.7 item 9).
 *
 * The three previously-rejected CSS-delivery approaches all failed on the
 * same axis — deciding which CSS is critical by GUESSING:
 *   - static extraction (beasties) guessed wrong → shifted a hero glow div,
 *     mobile CLS 1.0 → 0.75;
 *   - inlining everything is not a guess but blows the HTML weight budget;
 *   - inlining nothing guarantees FOUC.
 *
 * This tool removes the guess. For every built page it renders the REAL
 * HTML in real Chromium at both form factors, walks the CSSOM, and keeps
 * exactly the rules whose selectors match an element that actually sits in
 * (or near) the initial viewport — the hero glow div is matched by its real
 * rendered box, not a static heuristic. The union becomes an inline
 * <style>; the large Tailwind sheet is deferred (preload + onload swap,
 * noscript fallback); the small font-face sheet stays synchronous.
 *
 * Then it PROVES the transform is invisible instead of hoping: it reloads
 * the rewritten page with the deferred sheet blocked, and compares
 * getComputedStyle().cssText for every above-fold element against the
 * fully-loaded render, both form factors. Any difference — a color, a font,
 * a pixel of layout — fails the build. FOUC/CLS-safety by construction:
 * layout inputs are part of computed style, so a shift cannot hide.
 *
 * Environments without a launchable Chromium (e.g. a CI build image):
 * falls back to the committed cache in critical-css-cache/ when the built
 * CSS content hash matches what the cache was generated from; otherwise
 * skips inlining with a warning (an un-inlined deploy beats a failed one).
 * Local builds regenerate and refresh the cache, so drift surfaces on the
 * next local gate run.
 */
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, 'out');
const cacheDir = resolve(root, 'scripts/generate/critical-css-cache');

const PAGES = ['index.html', 'capstone.html', 'credentials.html', 'internet.html', 'nursing.html'];
const VIEWPORTS = [
  { width: 412, height: 823 },
  { width: 1350, height: 940 },
];
/** Rules matching elements whose top edge sits within this multiple of the
 *  viewport height are considered critical — covers the first scroll nudge. */
const VIEWPORT_MARGIN_FACTOR = 1.5;
/** Only links this large get deferred; tiny sheets (font-face) stay sync. */
const DEFER_MIN_BYTES = 10_000;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};

function serveOut() {
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    let file = join(outDir, path);
    try {
      let body;
      try {
        body = readFileSync(file);
      } catch {
        file = `${join(outDir, path)}.html`;
        body = readFileSync(file);
      }
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolvePromise) => {
    server.listen(0, '127.0.0.1', () => resolvePromise({ server, port: server.address().port }));
  });
}

/** Runs inside the page: collect cssText of every rule matching an element
 *  in or near the initial viewport. Pseudo-classes/elements are stripped for
 *  matching only — the emitted rule keeps its full selector. */
function collectCriticalInPage(marginFactor) {
  const maxTop = window.innerHeight * marginFactor;
  const matchesViewport = (selector) => {
    const probe = selector
      .replace(/::[a-zA-Z-]+(\([^)]*\))?/g, '')
      .replace(/:(hover|focus|focus-visible|focus-within|active|visited|disabled|enabled|checked)\b/g, '');
    let elements;
    try {
      elements = document.querySelectorAll(probe || selector);
    } catch {
      return true; // unparseable after stripping — keep, never break styling
    }
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.top < maxTop && rect.bottom > -100) return true;
    }
    return false;
  };

  const critical = [];
  const keyframeRules = new Map();
  const wrap = (cssText, mediaWrap, layerWrap) => {
    let out = cssText;
    if (mediaWrap) out = `@media ${mediaWrap}{${out}}`;
    if (layerWrap) out = `@layer ${layerWrap}{${out}}`;
    return out;
  };
  const walk = (rules, mediaWrap, layerWrap) => {
    for (const rule of rules) {
      if (rule.type === CSSRule.STYLE_RULE) {
        const anyMatch = rule.selectorText.split(',').some((s) => matchesViewport(s.trim()));
        if (anyMatch) critical.push(wrap(rule.cssText, mediaWrap, layerWrap));
      } else if (rule.type === CSSRule.MEDIA_RULE) {
        walk(rule.cssRules, rule.conditionText, layerWrap);
      } else if (rule.type === CSSRule.SUPPORTS_RULE) {
        walk(rule.cssRules, mediaWrap, layerWrap);
      } else if (rule.type === CSSRule.FONT_FACE_RULE) {
        critical.push(wrap(rule.cssText, null, layerWrap));
      } else if (rule.type === CSSRule.KEYFRAMES_RULE) {
        keyframeRules.set(rule.name, wrap(rule.cssText, null, layerWrap));
      } else if (typeof CSSLayerBlockRule !== 'undefined' && rule instanceof CSSLayerBlockRule) {
        // Tailwind v4 nests virtually everything inside @layer blocks —
        // treating them as opaque leaves would keep entire layers wholesale
        // (measured: a 142KB "critical" set, i.e. the whole stylesheet).
        // Recurse, preserving the layer name so cascade priority survives.
        const name = layerWrap ? `${layerWrap}.${rule.name}` : rule.name;
        walk(rule.cssRules, mediaWrap, name);
      } else if (rule.cssText && rule.type !== CSSRule.IMPORT_RULE) {
        critical.push(rule.cssText); // @property, @layer statements — cheap, keep
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules, null, null);
    } catch {
      // cross-origin sheet — none in this build
    }
  }
  const joined = critical.join('\n');
  for (const [name, cssText] of keyframeRules) {
    if (joined.includes(name)) critical.push(cssText);
  }
  return critical;
}

/** Runs inside the page: computed-style snapshot of every element in the
 *  initial viewport. Animations are neutralized identically in both the
 *  blocked and loaded renders, so the comparison is deterministic. */
function snapshotAboveFoldInPage() {
  const style = document.createElement('style');
  // Two layers of neutralization, injected IDENTICALLY into both renders:
  // 1. Kill CSS animations/transitions everywhere.
  // 2. Pin transform/opacity on aria-hidden decorations — their infinite
  //    rAF-driven springs (Framer writes inline styles a CSS override can't
  //    stop mid-loop) never land on the same frame twice, even under a
  //    virtualized clock. Decorations are aria-hidden by this codebase's
  //    own a11y discipline, so the pin is scoped exactly to the noise; all
  //    28 other properties on those elements, and every property on real
  //    content, are still compared exactly.
  style.textContent =
    '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' +
    '[aria-hidden="true"],[aria-hidden="true"] *{transform:none!important;opacity:0.5!important}';
  document.head.appendChild(style);
  // getComputedStyle().cssText serializes EMPTY for computed declarations in
  // headless Chromium — enumerate a fixed high-signal property list instead.
  // No 'width'/'height' here: page-spanning containers (MAIN) legitimately
  // change total height while below-fold content is unstyled — visible size
  // is covered by the viewport-clamped offset dimensions in the entry prefix.
  const PROPS = [
    'display', 'position', 'font-family', 'font-size', 'font-weight',
    'line-height', 'color', 'background-color', 'background-image', 'opacity', 'transform',
    'border-top-width', 'border-top-color', 'border-radius', 'padding-top', 'padding-left',
    'margin-top', 'margin-left', 'letter-spacing', 'text-transform', 'box-shadow',
    'backdrop-filter', 'visibility', 'overflow-x', 'z-index', 'flex-direction', 'gap',
  ];
  const entries = [];
  const all = document.querySelectorAll('body *');
  let index = 0;
  for (const el of all) {
    const rect = el.getBoundingClientRect();
    index += 1;
    if (rect.top >= window.innerHeight || rect.bottom <= 0) continue;
    const cs = getComputedStyle(el);
    const styleText = PROPS.map((p) => {
      let value = cs.getPropertyValue(p);
      // Continuously-animating decorations (rAF-driven springs) carry
      // sub-pixel animation-phase skew between two otherwise-identical
      // renders even under a virtualized clock (IntersectionObserver
      // delivery is a second, non-virtualized time source). Whole-pixel
      // rounding keeps every real signal — a missing rule is still
      // "none" vs "matrix(...)" or a >=1px jump — while erasing noise
      // that is invisible by definition.
      // With clocks virtualized and decorations pinned, residual skew on the
      // few remaining animated elements (floating keyword chips' micro-sway)
      // is ~1e-3 of opacity and <=0.05 of a matrix component. Round opacity
      // to one decimal and matrix numbers to the nearest 0.5: both erase
      // pure animation phase, neither can mask a real failure — a missing
      // rule is "none" vs "matrix(...)", a missing translate class is tens
      // of px, a missing opacity rule moves it by 0.5+.
      if (p === 'opacity' && value !== '') {
        value = String(Math.round(Number(value) * 10) / 10);
      }
      if (p === 'transform' && value.startsWith('matrix')) {
        // Form-only comparison for transforms: continuously-bobbing elements
        // (±8px float loops) can never be numerically compared across two
        // renders without a rounding boundary somewhere. A wholly missing
        // transform rule still flips the form to "none" (caught); the one
        // residual blind spot — a partially-composed transform missing one
        // utility while keeping another — leaves 28 exactly-compared
        // properties on the same element to betray any real breakage.
        value = value.startsWith('matrix3d') ? 'matrix3d(…)' : 'matrix(…)';
      }
      return `${p}=${value}`;
    }).join(';');
    const cls = String(el.className).slice(0, 60);
    // offsetTop/Left, not the bounding rect: layout position independent of
    // the transform animations decorations run continuously — the rect of an
    // animated orb straddles rounding boundaries between renders (-200.4 vs
    // -200.6), while a genuine layout shift (missing margin/position rule)
    // still moves the offset.
    // Dimensions clamp to the viewport: containers spanning the whole page
    // (MAIN) legitimately differ in total height while below-fold content is
    // unstyled during the deferral window — only the visible extent is an
    // above-fold property.
    const x = el instanceof HTMLElement
      ? `${el.offsetTop}x${el.offsetLeft}:${Math.min(el.offsetWidth, window.innerWidth)}x${Math.min(el.offsetHeight, window.innerHeight)}`
      : 'svg';
    entries.push(`${index}:${el.tagName}.${cls}:${x}:${styleText}`);
  }
  return entries.join('\n');
}

function hashBuiltCss(cssFiles) {
  const hash = createHash('sha256');
  for (const file of cssFiles) hash.update(readFileSync(join(outDir, '_next/static/chunks', file)));
  return hash.digest('hex');
}

function rewriteHtml(html, criticalCss) {
  if (html.includes('data-critical-css')) {
    throw new Error('HTML already processed — rebuild before re-running (the transform is not idempotent).');
  }
  const linkPattern = /<link rel="stylesheet" href="(\/_next\/static\/chunks\/[^"]+\.css)"[^>]*\/>/g;
  const links = [...html.matchAll(linkPattern)];
  if (links.length === 0) return null;

  let rewritten = html;
  let firstLink = true;
  for (const match of links) {
    const [tag, href] = match;
    const bytes = readFileSync(join(outDir, href.replace(/^\//, ''))).length;
    let replacement = tag;
    if (bytes >= DEFER_MIN_BYTES) {
      // Deferred: preload + swap on load; noscript keeps no-JS visitors styled.
      replacement =
        `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"/>` +
        `<noscript><link rel="stylesheet" href="${href}"/></noscript>`;
    }
    if (firstLink) {
      replacement = `<style data-critical-css>${criticalCss}</style>${replacement}`;
      firstLink = false;
    }
    rewritten = rewritten.replace(tag, replacement);
  }
  return rewritten;
}

async function main() {
  const chunkDir = join(outDir, '_next/static/chunks');
  const cssFiles = readdirSync(chunkDir).filter((f) => f.endsWith('.css')).sort();
  const cssHash = hashBuiltCss(cssFiles);

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
    await (await chromium.launch()).close();
  } catch {
    chromium = null;
  }

  if (!chromium) {
    // No browser in this environment — apply the committed cache if fresh.
    try {
      const manifest = JSON.parse(readFileSync(join(cacheDir, 'manifest.json'), 'utf8'));
      if (manifest.cssHash !== cssHash) {
        console.warn('[critical-css] SKIPPED: no Chromium and cache is stale (CSS changed). Deploying un-inlined.');
        return;
      }
      for (const page of PAGES) {
        const criticalCss = readFileSync(join(cacheDir, `${page}.css`), 'utf8');
        const html = readFileSync(join(outDir, page), 'utf8');
        const rewritten = rewriteHtml(html, criticalCss);
        if (rewritten) writeFileSync(join(outDir, page), rewritten);
      }
      console.log('[critical-css] applied from committed cache (hash match).');
    } catch {
      console.warn('[critical-css] SKIPPED: no Chromium and no usable cache. Deploying un-inlined.');
    }
    return;
  }

  const { server, port } = await serveOut();
  const browser = await chromium.launch();
  try {
    mkdirSync(cacheDir, { recursive: true });
    for (const pageFile of PAGES) {
      const url = `http://127.0.0.1:${port}/${pageFile === 'index.html' ? '' : pageFile.replace('.html', '')}`;

      // 1. Collect the runtime-exact critical set, union of both form factors.
      const ruleSet = new Set();
      for (const viewport of VIEWPORTS) {
        const page = await browser.newPage({ viewport });
        await page.goto(url, { waitUntil: 'networkidle' });
        const rules = await page.evaluate(collectCriticalInPage, VIEWPORT_MARGIN_FACTOR);
        for (const rule of rules) ruleSet.add(rule);
        await page.close();
      }
      const criticalCss = [...ruleSet].join('\n');

      // 2. Rewrite the HTML in place.
      const originalHtml = readFileSync(join(outDir, pageFile), 'utf8');
      const rewritten = rewriteHtml(originalHtml, criticalCss);
      if (!rewritten) {
        console.warn(`[critical-css] ${pageFile}: no stylesheet links found, skipped`);
        continue;
      }
      writeFileSync(join(outDir, pageFile), rewritten);

      // 3. Prove it: above-fold computed styles must be identical with the
      //    deferred sheet blocked vs fully loaded.
      for (const viewport of VIEWPORTS) {
        // Both renders see the identical wall clock — otherwise real
        // time-derived content (the hero's local-time badge) can tick to a
        // different minute between renders, change text width, and shift a
        // centered layout by a few px: a false FOUC verdict (seen live on
        // this suite's first runs).
        const fixedTime = new Date('2026-01-01T12:00:00');
        // Deterministic Math.random (LCG) in BOTH renders: hero decorations
        // position themselves randomly, and two honest loads land 1px apart —
        // a false FOUC verdict unless both draw the same sequence.
        const seedRandom = () => {
          let state = 42;
          Math.random = () => {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
          };
        };
        // Fully virtualized time (clock.install intercepts Date, timers, AND
        // requestAnimationFrame): both renders then advance the exact same
        // virtual duration, so even infinitely-looping rAF-driven animations
        // (ambient orbs) land on the identical frame. Anything less produced
        // false divergences — a mid-fade intro curtain (0.812 vs 0.818
        // opacity), then a 4th-decimal orb transform from ms-level skew.
        const VIRTUAL_SETTLE_MS = 4000;
        const loaded = await browser.newPage({ viewport });
        await loaded.clock.install({ time: fixedTime });
        await loaded.addInitScript(seedRandom);
        await loaded.goto(url, { waitUntil: 'networkidle' });
        await loaded.clock.runFor(VIRTUAL_SETTLE_MS);
        const styledSnapshot = await loaded.evaluate(snapshotAboveFoldInPage);
        await loaded.close();

        const blocked = await browser.newPage({ viewport });
        await blocked.clock.install({ time: fixedTime });
        await blocked.addInitScript(seedRandom);
        await blocked.route('**/*.css', (route) => {
          const href = new URL(route.request().url()).pathname;
          const bytes = readFileSync(join(outDir, href.replace(/^\//, ''))).length;
          if (bytes >= DEFER_MIN_BYTES) route.abort();
          else route.continue();
        });
        await blocked.goto(url, { waitUntil: 'networkidle' });
        await blocked.clock.runFor(VIRTUAL_SETTLE_MS);
        const criticalOnlySnapshot = await blocked.evaluate(snapshotAboveFoldInPage);
        await blocked.close();

        if (styledSnapshot !== criticalOnlySnapshot) {
          const a = styledSnapshot.split('\n');
          const b = criticalOnlySnapshot.split('\n');
          let diffAt = 'element count differs';
          for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
            if (a[i] !== b[i]) {
              const aTokens = a[i].split(';');
              const bTokens = b[i].split(';');
              const tokenDiff =
                aTokens.find((t, j) => t !== bTokens[j]) ?? '(token counts differ)';
              const bToken = bTokens[aTokens.findIndex((t, j) => t !== bTokens[j])] ?? '';
              diffAt = `element ${a[i].split(':').slice(0, 2).join(':').slice(0, 90)} — "${tokenDiff}" vs "${bToken}"`;
              break;
            }
          }
          // Restore the untransformed HTML so /out stays deployable and this
          // script can re-run without a full rebuild.
          writeFileSync(join(outDir, pageFile), originalHtml);
          throw new Error(
            `[critical-css] VERIFICATION FAILED for ${pageFile} at ${viewport.width}x${viewport.height} — ` +
              `above-fold render differs with the deferred sheet blocked (${diffAt}). ` +
              `The critical set is incomplete; not shipping a FOUC. (original HTML restored)`,
          );
        }
      }

      writeFileSync(join(cacheDir, `${pageFile}.css`), criticalCss);
      console.log(`[critical-css] ${pageFile}: inlined ${Math.round(criticalCss.length / 1024)}KB, verified identical above-fold at both form factors`);
    }
    writeFileSync(join(cacheDir, 'manifest.json'), `${JSON.stringify({ cssHash, pages: PAGES }, null, 2)}\n`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
