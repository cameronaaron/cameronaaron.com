import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

type LighthouseConfig = {
  ci?: {
    collect?: {
      settings?: {
        formFactor?: string;
        screenEmulation?: { mobile?: boolean };
      };
    };
    assert?: {
      preset?: string;
      assertions?: Record<string, unknown>;
    };
  };
};

function expectStrictAssertions(assertions: Record<string, unknown>, performanceMinScore: number): void {
  expect(assertions['categories:performance']).toBeTruthy();
  expect(assertions['categories:performance']).toEqual(['error', { minScore: performanceMinScore }]);
  expect(assertions['categories:accessibility']).toEqual(['error', { minScore: 1 }]);
  expect(assertions['categories:best-practices']).toEqual(['error', { minScore: 1 }]);
  expect(assertions['categories:seo']).toEqual(['error', { minScore: 1 }]);
  expect(assertions['first-contentful-paint']).toBeTruthy();
  expect(assertions['largest-contentful-paint']).toBeTruthy();
  expect(assertions['cumulative-layout-shift']).toBeTruthy();
  expect(assertions['total-blocking-time']).toBeTruthy();
  expect(assertions['speed-index']).toBeTruthy();
  expect(assertions['interactive']).toBeTruthy();
  // forced-reflow-insight is demoted to warn deliberately (2026-07): it's a
  // binary-scored diagnostic that flipped 0/1/0 across three otherwise-identical
  // local runs, attributes its ~35ms of reflow to "[unattributed]" (nothing
  // actionable), and does not feed the performance category score — runs where
  // it scored 0 still scored a perfect 100. Same class as the other insight
  // audits below.
  expect(assertions['forced-reflow-insight']).toBe('warn');
  expect(assertions['image-delivery-insight']).toBe('warn');
  expect(assertions['label-content-name-mismatch']).toBe('warn');
  expect(assertions['legacy-javascript-insight']).toBe('warn');
  expect(assertions['network-dependency-tree-insight']).toBe('warn');
  expect(assertions['unused-javascript']).toBe('warn');
  expect(assertions['uses-responsive-images']).toBe('warn');
}

describe('performance regression contract', () => {
  it('keeps npm performance scripts wired for static budgets and lighthouse on desktop and mobile', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>;
    };

    const scripts = packageJson.scripts ?? {};

    expect(scripts['test:performance:contracts']).toBe('node scripts/performance-budgets.mjs');

    expect(scripts['test:performance:desktop']).toContain('pnpm run build');
    expect(scripts['test:performance:desktop']).toContain('pnpm run test:performance:contracts');
    expect(scripts['test:performance:desktop']).toContain('@lhci/cli');
    expect(scripts['test:performance:desktop']).toContain('--config=lighthouserc.json');

    expect(scripts['test:performance:mobile']).toContain('pnpm run build');
    expect(scripts['test:performance:mobile']).toContain('pnpm run test:performance:contracts');
    expect(scripts['test:performance:mobile']).toContain('@lhci/cli');
    expect(scripts['test:performance:mobile']).toContain('--config=lighthouserc.mobile.json');

    // The mandatory gate must run both form factors — neither can be skipped.
    expect(scripts['test:performance']).toContain('test:performance:desktop');
    expect(scripts['test:performance']).toContain('test:performance:mobile');

    expect(scripts['deploy:pages:prod']).toContain('pnpm run test:performance');
  });

  it('keeps CI performance checks in build contracts and both lighthouse form-factor assertions', () => {
    const ciWorkflow = read('.github/workflows/ci.yml');

    expect(ciWorkflow).toContain('Run static performance budget contracts');
    expect(ciWorkflow).toContain('npm run test:performance:contracts');
    expect(ciWorkflow).toContain('Lighthouse Assertions (Desktop)');
    expect(ciWorkflow).toContain('Lighthouse Assertions (Mobile)');
    expect(ciWorkflow).toContain('configPath: ./lighthouserc.json');
    expect(ciWorkflow).toContain('configPath: ./lighthouserc.mobile.json');
  });

  it('keeps desktop lighthouse thresholds for performance and core web vitals assertions', () => {
    const lighthouseConfig = JSON.parse(read('lighthouserc.json')) as LighthouseConfig;

    expect(lighthouseConfig.ci?.assert?.preset).toBe('lighthouse:recommended');
    // 1.0 on desktop, single run — an explicit owner decision (2026-07). The
    // prior 0.90/3-run calibration existed because the CI runner median sat
    // at 0.93 with the bottleneck alternating between speed-index and
    // total-blocking-time. The speed-index side was then fixed at the source:
    // IntroCurtain's dismissal used to wait on React hydration before its
    // 600ms hold even started, so on slow runner CPUs the viewport stayed
    // covered for seconds; it now fades out via a pure CSS animation baked
    // into the server-rendered markup (see globals.css intro-curtain-exit),
    // decoupling visual completeness from JS entirely. If this gate flakes,
    // fix the page (or revisit the decision with data) — do not silently
    // lower the threshold.
    expectStrictAssertions(lighthouseConfig.ci?.assert?.assertions ?? {}, 1);
  });

  it('keeps desktop Lighthouse at a single run', () => {
    // numberOfRuns is pinned to 1 (owner decision, 2026-07): with the page
    // fixed at the source there is no variance for extra samples to absorb,
    // and the extra runs only bought CI minutes. History (see
    // ENGINEERING-STANDARDS.md §4.7): raising 3->5 runs never moved a stable
    // median — more samples improve measurement, not the value.
    const lighthouseConfig = JSON.parse(read('lighthouserc.json')) as { ci?: { collect?: { numberOfRuns?: number } } };
    expect(lighthouseConfig.ci?.collect?.numberOfRuns).toBe(1);
  });

  it('keeps mobile Lighthouse at a single run', () => {
    const lighthouseConfig = JSON.parse(read('lighthouserc.mobile.json')) as { ci?: { collect?: { numberOfRuns?: number } } };
    expect(lighthouseConfig.ci?.collect?.numberOfRuns).toBe(1);
  });

  it('keeps mobile lighthouse thresholds matching desktop, with mobile emulation', () => {
    const lighthouseConfig = JSON.parse(read('lighthouserc.mobile.json')) as LighthouseConfig;

    expect(lighthouseConfig.ci?.assert?.preset).toBe('lighthouse:recommended');
    // Mobile has held a clean 1.0 across every observed run (local and CI) — no tolerance needed.
    expectStrictAssertions(lighthouseConfig.ci?.assert?.assertions ?? {}, 1);

    // Must actually emulate a mobile device — otherwise this is just desktop scoring twice.
    expect(lighthouseConfig.ci?.collect?.settings?.formFactor).toBe('mobile');
    expect(lighthouseConfig.ci?.collect?.settings?.screenEmulation?.mobile).toBe(true);
  });

  it('keeps pre-deployment verification wired to strict performance checks', () => {
    const verifyScript = read('scripts/verify-deployment.sh');

    expect(verifyScript).toContain('pnpm run test:performance');
  });
});
