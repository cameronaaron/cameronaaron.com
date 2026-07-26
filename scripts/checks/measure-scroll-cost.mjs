#!/usr/bin/env node
/**
 * Real-browser SCROLL-TIME cost measurement (ENGINEERING-STANDARDS.md §9.5).
 *
 * Lighthouse loads a page; it never scrolls it. So a change that only affects
 * what happens *during* scrolling — a scroll-linked animation, a spring, a
 * pointer-driven effect — is structurally invisible to the load gate, and
 * judging one by Lighthouse produces a confident false "no-op". That is how
 * the LazyMotion migration was wrongly reverted (§0.3/§0.4) and how the
 * scroll-velocity port nearly was (§9.5). This is the missing instrument.
 *
 * Drives real Chromium (Playwright) against the actual static build, the same
 * server-lifecycle and Playwright posture `measure-interaction-latency.mjs`
 * already establishes, and reads CDP `Performance.getMetrics` counters across
 * a scripted wheel gesture: ScriptDuration, RecalcStyleDuration,
 * LayoutDuration, TaskDuration.
 *
 * Read all four together, never ScriptDuration alone. A drop in per-frame JS
 * can mean the page rendered FEWER frames rather than cheaper ones — the first
 * version of the scroll-velocity port measured "-55% script" while actually
 * being ~9% worse overall, because its style-recalc storm was dropping frames
 * (§9.5 lesson 2).
 *
 * A/B usage (the intended one — a single absolute number means little):
 *
 *   pnpm run build                      # candidate build
 *   node scripts/checks/measure-scroll-cost.mjs --baseline path/to/old-out
 *
 * With --baseline the two builds are measured in INTERLEAVED pairs within one
 * process, so machine drift and background load hit both arms equally;
 * sequential blocks let a stray process contaminate one arm only. Report the
 * raw per-run values, not just the medians — overlapping ranges are noise, and
 * only non-overlapping ranges support a claim (§0.5: state the conditions with
 * every number).
 *
 * Slow (boots servers + a real browser) — a manual investigation tool, never
 * part of the pre-commit/pre-push gate. Same posture as the Lighthouse gate
 * and the external-links ledger checker (§6 item 9).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

import { chromium } from 'playwright';

const CANDIDATE_PORT = 4501;
const BASELINE_PORT = 4502;
/** Lets the IntroCurtain's CSS fade finish and hydration settle before scrolling. */
const SETTLE_MS = 1500;
/** Wheel steps down, then the same number back up — a full there-and-back gesture. */
const WHEEL_STEPS = 120;
const WHEEL_DELTA_PX = 90;
const WHEEL_GAP_MS = 8;
/** Lets any spring/decay tail finish inside the measured window. */
const TAIL_MS = 400;

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

const METRICS = ['script', 'recalc', 'layout', 'task'];

function parseArgs(argv) {
  const args = { dir: 'out', baseline: null, pairs: 7, mobile: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--baseline') args.baseline = argv[(i += 1)];
    else if (argv[i] === '--dir') args.dir = argv[(i += 1)];
    else if (argv[i] === '--pairs') args.pairs = Number(argv[(i += 1)]);
    else if (argv[i] === '--mobile') args.mobile = true;
  }
  return args;
}

/**
 * Minimal static server. Deliberately not `wrangler pages dev` (which the
 * Lighthouse gate uses): wrangler's own worker runtime and inspector socket
 * add main-thread-adjacent work that would land inside the very counters this
 * script is trying to attribute to the page.
 */
function serveDirectory(dir, port) {
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(req.url.split('?')[0]);
      let file = join(dir, pathname);
      try {
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      } catch {
        if (!extname(file)) file = join(dir, `${pathname}.html`);
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolvePromise) => server.listen(port, () => resolvePromise(server)));
}

function contextOptions(mobile) {
  return mobile
    ? { viewport: { width: 412, height: 823 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } };
}

async function sampleOnce(browser, port, mobile) {
  const page = await browser.newPage(contextOptions(mobile));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS);

  const readMetrics = async () => {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return Object.fromEntries(metrics.map((metric) => [metric.name, metric.value]));
  };

  const before = await readMetrics();
  for (let i = 0; i < WHEEL_STEPS; i += 1) {
    await page.mouse.wheel(0, WHEEL_DELTA_PX);
    await page.waitForTimeout(WHEEL_GAP_MS);
  }
  for (let i = 0; i < WHEEL_STEPS; i += 1) {
    await page.mouse.wheel(0, -WHEEL_DELTA_PX);
    await page.waitForTimeout(WHEEL_GAP_MS);
  }
  await page.waitForTimeout(TAIL_MS);
  const after = await readMetrics();
  await page.close();

  // CDP reports these in seconds; milliseconds read better next to Lighthouse.
  return {
    script: (after.ScriptDuration - before.ScriptDuration) * 1000,
    recalc: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
    layout: (after.LayoutDuration - before.LayoutDuration) * 1000,
    task: (after.TaskDuration - before.TaskDuration) * 1000,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[(sorted.length - 1) >> 1];
}

function range(values) {
  return `${Math.min(...values).toFixed(0)}–${Math.max(...values).toFixed(0)}`;
}

function overlaps(a, b) {
  return Math.min(...a) <= Math.max(...b) && Math.min(...b) <= Math.max(...a);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candidateDir = resolve(args.dir);
  const baselineDir = args.baseline ? resolve(args.baseline) : null;

  const servers = [await serveDirectory(candidateDir, CANDIDATE_PORT)];
  if (baselineDir) servers.push(await serveDirectory(baselineDir, BASELINE_PORT));

  const browser = await chromium.launch();
  const candidate = [];
  const baseline = [];

  for (let pair = 0; pair < args.pairs; pair += 1) {
    // Alternate which arm leads so warm-up order cannot favour either build.
    if (!baselineDir) {
      candidate.push(await sampleOnce(browser, CANDIDATE_PORT, args.mobile));
    } else if (pair % 2 === 0) {
      baseline.push(await sampleOnce(browser, BASELINE_PORT, args.mobile));
      candidate.push(await sampleOnce(browser, CANDIDATE_PORT, args.mobile));
    } else {
      candidate.push(await sampleOnce(browser, CANDIDATE_PORT, args.mobile));
      baseline.push(await sampleOnce(browser, BASELINE_PORT, args.mobile));
    }
    process.stderr.write(`  pair ${pair + 1}/${args.pairs}\n`);
  }

  const formFactor = args.mobile ? 'MOBILE 412x823 (coarse pointer)' : 'DESKTOP 1440x900 (fine pointer)';
  console.log(`\n=== scroll cost — ${formFactor} — ${args.pairs} runs per arm ===`);
  console.log(`    gesture: ${WHEEL_STEPS} wheel steps down + ${WHEEL_STEPS} up @ ${WHEEL_DELTA_PX}px\n`);

  if (!baselineDir) {
    for (const key of METRICS) {
      const values = candidate.map((sample) => sample[key]);
      console.log(`  ${key.padEnd(8)} median=${median(values).toFixed(0)}ms  range=${range(values)}`);
    }
    console.log('\n  Single-build run: absolute numbers only. Re-run with --baseline <dir> to compare.');
  } else {
    console.log('  metric     BASELINE     CANDIDATE       delta   verdict');
    for (const key of METRICS) {
      const a = baseline.map((sample) => sample[key]);
      const b = candidate.map((sample) => sample[key]);
      const delta = median(b) - median(a);
      const pct = (delta / median(a)) * 100;
      // Overlapping ranges are noise; only a clean separation supports a claim.
      const verdict = overlaps(a, b) ? 'NOISE (ranges overlap)' : 'SIGNAL (ranges disjoint)';
      console.log(
        `  ${key.padEnd(9)} ${median(a).toFixed(0).padStart(8)}ms ${median(b).toFixed(0).padStart(11)}ms  ` +
          `${(delta >= 0 ? '+' : '') + delta.toFixed(0)}ms (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)  ${verdict}`
      );
    }
    console.log('\n  raw per-run values:');
    for (const key of METRICS) {
      console.log(`    ${key.padEnd(8)} baseline=[${baseline.map((s) => s[key].toFixed(0)).join(', ')}]`);
      console.log(`    ${key.padEnd(8)} candidate=[${candidate.map((s) => s[key].toFixed(0)).join(', ')}]`);
    }
  }

  await browser.close();
  for (const server of servers) server.close();
}

await main();
