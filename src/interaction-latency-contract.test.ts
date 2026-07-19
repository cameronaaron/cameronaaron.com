/**
 * Fast, offline half of the input-latency gate (ENGINEERING-STANDARDS.md
 * §1a). The real measurement — real Chromium, real INP via `web-vitals`,
 * real `PerformanceObserver('longtask')` entries — cannot run in jsdom (no
 * compositor, no browser task queue), so it lives in
 * scripts/checks/measure-interaction-latency.mjs and runs in the slow,
 * deploy-time tier (`pnpm run test:interaction-latency`, part of
 * `deploy:pages:prod`). This test is the thing that runs on every commit:
 * it verifies the *wiring* — the budgets are the documented ones, the
 * representative-interaction list is real and non-empty, the script exists
 * and points at real production files, and both the npm script and the
 * deploy pipeline actually invoke it. Same relationship as
 * performance-regression-contract.test.ts has to Lighthouse.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { INP_BUDGET_MS, INTERACTIONS, LONG_TASK_THRESHOLD_MS } from '../scripts/checks/interaction-latency-config.mjs';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('interaction-latency budgets', () => {
  it('pins the documented INP and long-task budgets', () => {
    // Core Web Vitals' "good" INP threshold is <200ms; 100ms is the low
    // half of that range, where interactions read as instant.
    expect(INP_BUDGET_MS).toBe(100);
    // Not configurable — PerformanceObserver's own longtask spec defines
    // "long" as >50ms. Documented here so the source constant and this
    // test can never silently drift apart.
    expect(LONG_TASK_THRESHOLD_MS).toBe(50);
  });

  it('has a non-empty representative-interaction list, each naming a real production file', () => {
    expect(INTERACTIONS.length).toBeGreaterThan(0);
    for (const interaction of INTERACTIONS) {
      expect(interaction.name.length).toBeGreaterThan(0);
      expect(typeof interaction.run).toBe('function');
      expect(existsSync(resolve(process.cwd(), interaction.file)), `${interaction.file} does not exist`).toBe(true);
    }
  });

  it('every interaction targets a distinct file', () => {
    const files = INTERACTIONS.map((i) => i.file);
    expect(new Set(files).size).toBe(files.length);
  });
});

describe('interaction-latency gate wiring', () => {
  it('the measurement script exists', () => {
    expect(existsSync(resolve(process.cwd(), 'scripts/checks/measure-interaction-latency.mjs'))).toBe(true);
  });

  it('a package.json script runs the measurement script', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts['test:interaction-latency']).toContain('measure-interaction-latency.mjs');
  });

  it('deploy:pages:prod runs the interaction-latency gate before deploying', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const deployScript = pkg.scripts['deploy:pages:prod'];
    expect(deployScript).toContain('test:interaction-latency');

    const latencyIndex = deployScript.indexOf('test:interaction-latency');
    const wranglerIndex = deployScript.indexOf('wrangler pages deploy');
    expect(latencyIndex).toBeGreaterThan(-1);
    expect(wranglerIndex).toBeGreaterThan(-1);
    expect(latencyIndex).toBeLessThan(wranglerIndex);
  });
});
