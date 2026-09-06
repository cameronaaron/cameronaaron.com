#!/usr/bin/env node
/**
 * Real-browser input-latency gate (ENGINEERING-STANDARDS.md §1a).
 *
 * jsdom cannot produce this signal: it has no compositor, no real browser
 * task queue, and no PerformanceObserver — so this drives real Chromium
 * (Playwright) against the actual static build, the same server-lifecycle
 * pattern lighthouserc.json already uses (`wrangler pages dev out`).
 *
 * For each representative interaction below: inject Google's own `web-vitals`
 * library (the real INP algorithm — interaction grouping, worst-of-session
 * selection, presentation-time measurement; not worth hand-rolling) and a
 * `PerformanceObserver({type:'longtask'})` before any page script runs, drive
 * the interaction with real (CDP-dispatched, trusted) Playwright input, then
 * read back the reported INP value and any long-task entries. A long-task
 * entry existing at all is already a violation — >50ms blocking is the
 * PerformanceObserver API's own definition of "long", not a threshold we
 * chose.
 *
 * Slow (boots a server + real browser) — lives in the deploy-time tier
 * (`pnpm run test:interaction-latency`, part of `deploy:pages:prod`), never
 * the pre-commit/pre-push hook. Same posture as the Lighthouse gate and the
 * external-links ledger checker (ENGINEERING-STANDARDS.md §6 item 9).
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve as resolvePath } from 'node:path';

import { chromium } from 'playwright';
import { partitionLongTasks } from './interaction-latency-analysis.mjs';

import { INP_BUDGET_MS, INTERACTIONS, LONG_TASK_THRESHOLD_MS, RUNS_PER_INTERACTION } from './interaction-latency-config.mjs';

// web-vitals' package.json "exports" map only publishes its ESM/CJS entry
// points, not the browser IIFE bundle — resolve the physical file directly
// rather than through the (deliberately narrower) public API.
const WEB_VITALS_IIFE_PATH = resolvePath(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../node_modules/web-vitals/dist/web-vitals.iife.js'
);
// Playwright's addInitScript wraps injected content in its own scope, so the
// bundle's top-level `var webVitals = ...` never becomes a real `window`
// property the way a plain <script> tag would — confirmed by hand (a bare
// injected IIFE left `typeof window.webVitals === 'undefined'`). Appending an
// explicit assignment in the SAME injected block fixes it, since the
// appended line shares that block's scope regardless of how it's wrapped.
const WEB_VITALS_SOURCE = `${readFileSync(WEB_VITALS_IIFE_PATH, 'utf8')}\nwindow.webVitals = webVitals;`;

const PORT = 3411;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 60_000;
/** Lets the server-rendered IntroCurtain's CSS fade-out finish and the page
 *  fully settle before we drive an interaction — matching how a real user's
 *  first click never lands mid-intro either. */
const SETTLE_MS = 1000;
/** Gap between the interaction resolving and nudging web-vitals' internal
 *  double-rAF flush — matches the timing of the hand-verified working
 *  sequence; a shorter gap here reproduced intermittent missed reports. */
const PRE_FLUSH_WAIT_MS = 500;
/** Empirically-generous window for web-vitals to compute and report INP
 *  after the flush nudge. */
const REPORT_WAIT_MS = 2000;

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolvePromise, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) {
          resolvePromise();
          return;
        }
      } catch {
        // server not up yet
      }
      if (Date.now() > deadline) {
        reject(new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`));
        return;
      }
      setTimeout(attempt, 500);
    };
    attempt();
  });
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function measureOnce(browser, interaction) {
  // Explicit context + page, not the browser.newPage() shorthand — confirmed
  // by hand that the shorthand silently leaves web-vitals' Event Timing
  // observer never firing (a real Playwright quirk, not a mistake in the
  // injected script itself: identical setup differing only in this one
  // regard reproducibly fails via the shorthand and succeeds via an explicit
  // context).
  const context = await browser.newContext({ viewport: interaction.viewport ?? { width: 1400, height: 1000 } });
  const page = await context.newPage();

  await page.addInitScript({ content: WEB_VITALS_SOURCE });
  await page.addInitScript(() => {
    window.__longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__longTasks.push({ name: entry.name, duration: entry.duration, startTime: entry.startTime });
      }
    }).observe({ type: 'longtask', buffered: true });

    window.__inp = null;
    window.webVitals.onINP((metric) => {
      window.__inp = metric.value;
    }, { reportAllChanges: true });
  });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  // web-vitals' Event Timing observer only reports for a genuinely focused,
  // visible document — confirmed by hand (identical setup without this
  // silently never fired). A headless page starts focused by default, but
  // asking explicitly removes the ambiguity.
  await page.bringToFront();
  await page.waitForTimeout(SETTLE_MS);

  // Same browser time origin as PerformanceEntry.startTime. Start before the
  // driver acts, including any scroll/focus it needs to reach its control.
  const interactionStart = await page.evaluate(() => performance.now());
  await interaction.run(page);
  await page.waitForTimeout(PRE_FLUSH_WAIT_MS);
  // Nudges web-vitals' internal presentation-time estimation (its own
  // double-rAF trick) to actually flush before we read the value back —
  // confirmed necessary by hand: REPORT_WAIT_MS alone left onINP unfired.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(REPORT_WAIT_MS);

  const inp = await page.evaluate(() => window.__inp);
  const longTasks = await page.evaluate(() => window.__longTasks);

  await context.close();
  return { inp, ...partitionLongTasks(longTasks, interactionStart) };
}

async function measureInteraction(browser, interaction) {
  const runs = [];
  for (let i = 0; i < RUNS_PER_INTERACTION; i += 1) {
    runs.push(await measureOnce(browser, interaction));
  }

  const reportedInps = runs.map((r) => r.inp).filter((v) => v !== null);
  // A long task in even one run out of several is a real event that
  // happened on this machine running this build — union, don't average it
  // away the way a scalar median would.
  const longTasks = runs.flatMap((r) => r.interactionLongTasks);
  const startupLongTasks = runs.flatMap((r) => r.startupLongTasks);

  return {
    ...interaction,
    inp: median(reportedInps),
    reportedRunCount: reportedInps.length,
    totalRunCount: RUNS_PER_INTERACTION,
    longTasks,
    startupLongTasks,
  };
}

async function main() {
  // `detached: true` puts the spawned process in its own process group —
  // `npx` forks the real wrangler process as a *child of npx*, so killing
  // just the returned PID only kills the npx wrapper and orphans wrangler
  // running on PORT (confirmed by hand: repeated runs left a growing pile of
  // live `wrangler pages dev` processes still bound to the port). Killing
  // the negative PID (`-server.pid`) signals the whole group instead.
  const server = spawn('npx', ['wrangler', 'pages', 'dev', 'out', '--port', String(PORT), '--ip', '127.0.0.1'], {
    stdio: 'pipe',
    detached: true,
  });
  server.on('error', (err) => {
    console.error('Failed to start wrangler pages dev:', err);
  });

  let exitCode = 0;
  try {
    await waitForServer(BASE_URL, SERVER_READY_TIMEOUT_MS);

    const browser = await chromium.launch();
    const results = [];
    for (const interaction of INTERACTIONS) {
      results.push(await measureInteraction(browser, interaction));
    }
    await browser.close();

    console.log(
      '\nInteraction latency report (budget: median INP <%dms over %d runs, zero long tasks >%dms):\n',
      INP_BUDGET_MS,
      RUNS_PER_INTERACTION,
      LONG_TASK_THRESHOLD_MS
    );
    for (const result of results) {
      // A missing reading is itself a failure, not a silent pass — a test
      // that can't fail is worse than no test (ENGINEERING-STANDARDS.md §6
      // item 8). Fewer than half the runs reporting is treated the same way
      // as none reporting: the *reliability* of the measurement is itself a
      // finding, not something to paper over with a lucky sample.
      const quorumMet = result.reportedRunCount >= Math.ceil(result.totalRunCount / 2);
      const inpFail = !quorumMet || result.inp === null || result.inp >= INP_BUDGET_MS;
      const inpText = result.inp === null ? 'NOT REPORTED' : `${result.inp.toFixed(1)}ms (median of ${result.reportedRunCount}/${result.totalRunCount} runs)`;
      const longTaskFail = result.longTasks.length > 0;
      const status = inpFail || longTaskFail ? 'FAIL' : 'PASS';
      console.log(`  [${status}] ${result.name} (${result.file})`);
      console.log(`         INP: ${inpText}${inpFail ? '  <-- exceeds budget, missing, or unreliable' : ''}`);
      console.log(
        `         Interaction long tasks: ${result.longTasks.length}${longTaskFail ? `  <-- ${result.longTasks.map((t) => `${t.duration.toFixed(1)}ms`).join(', ')}` : ''}`
      );
      console.log(`         Startup long tasks (load cost, reported separately): ${result.startupLongTasks.length}`);
      if (inpFail || longTaskFail) exitCode = 1;
    }
    console.log();
  } finally {
    try {
      process.kill(-server.pid);
    } catch {
      // Already exited, or the group is otherwise gone — nothing left to clean up.
    }
  }

  process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
