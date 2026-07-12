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

interface NumericCeilings {
  domSizeMaxElements: number;
  unusedJavascriptMaxMs: number;
  unusedJavascriptMaxFiles: number;
  legacyJavascriptMaxMs: number;
  legacyJavascriptMaxFiles: number;
}

function expectStrictAssertions(
  assertions: Record<string, unknown>,
  performanceMinScore: number,
  ceilings: NumericCeilings,
): void {
  expect(assertions['categories:performance']).toEqual(['error', { minScore: performanceMinScore }]);
  expect(assertions['categories:accessibility']).toEqual(['error', { minScore: 1 }]);
  expect(assertions['categories:best-practices']).toEqual(['error', { minScore: 1 }]);
  expect(assertions['categories:seo']).toEqual(['error', { minScore: 1 }]);
  // Core Web Vitals — exact thresholds, not just "the key exists" (a
  // toBeTruthy() check here would pass even if maxNumericValue were silently
  // loosened to something meaningless). Values match Google's "good" CWV
  // bar: FCP/LCP in ms, CLS unitless, TBT/interactive in ms.
  expect(assertions['first-contentful-paint']).toEqual(['error', { maxNumericValue: 1500 }]);
  expect(assertions['largest-contentful-paint']).toEqual(['error', { maxNumericValue: 2500 }]);
  expect(assertions['cumulative-layout-shift']).toEqual(['error', { maxNumericValue: 0.1 }]);
  expect(assertions['total-blocking-time']).toEqual(['error', { maxNumericValue: 300 }]);
  expect(assertions['speed-index']).toEqual(['error', { maxNumericValue: 3000 }]);
  expect(assertions['interactive']).toEqual(['error', { maxNumericValue: 3500 }]);

  // ── Tier 1: bare "warn" — audits with no meaningful numericValue in the LHR
  // (confirmed 2026-07 by inspecting real collected reports), so LHCI's
  // maxNumericValue mechanism cannot gate them. Pinned explicitly so a future
  // lighthouse/@lhci/cli upgrade can't silently flip a preset default from
  // warn to error and break the gate unannounced.
  //
  // forced-reflow-insight: a binary-scored diagnostic that flipped 0/1/0
  // across three otherwise-identical local runs, attributes its ~35ms of
  // reflow to "[unattributed]" (nothing actionable), zero category weight.
  expect(assertions['forced-reflow-insight']).toBe('warn');
  expect(assertions['image-delivery-insight']).toBe('warn');
  expect(assertions['label-content-name-mismatch']).toBe('warn');
  expect(assertions['uses-responsive-images']).toBe('warn');
  //
  // legacy-javascript-insight: root-caused (2026-07) to Next.js's own
  // next/dist/build/polyfills/polyfill-module.js — conditional guards like
  // `Array.prototype.at||(Array.prototype.at=function(){...})` for
  // Array.at/flat/flatMap/Object.fromEntries/Object.hasOwn/String.trimEnd,
  // shipped by Next's build pipeline itself (confirmed by grepping the exact
  // polyfill source into the built chunk), not application code and not
  // exposed via any next.config.mjs opt-out.
  expect(assertions['legacy-javascript-insight']).toBe('warn');
  //
  // network-dependency-tree-insight / render-blocking-insight /
  // render-blocking-resources: three distinct fixes were attempted and
  // measured (ENGINEERING-STANDARDS §4.7 history item 5) — critical-CSS
  // extraction via beasties (regressed mobile CLS 1.0→0.75), full-file
  // inlining (blows the HTML weight budget: 550KB raw / 70KB gzip vs the
  // 470KB/62KB homepage budget), and preload-without-inlining (reintroduces
  // FOUC, since font-display:swap alone doesn't cover the ~110KB Tailwind
  // utility stylesheet). All three real, measured, rejected.
  expect(assertions['network-dependency-tree-insight']).toBe('warn');
  expect(assertions['render-blocking-insight']).toBe('warn');
  expect(assertions['render-blocking-resources']).toBe('warn');

  // ── Tier 2: warn + numeric regression ceiling. These DO expose a stable
  // numericValue (confirmed via 3 authoritative LHCI runs per form factor,
  // 2026-07) — a future regression that meaningfully worsens them now fails
  // the gate even though today's baseline stays non-blocking. Ceilings carry
  // real headroom over the observed baseline, not a tight pin, so normal
  // content growth doesn't false-positive.
  expect(assertions['dom-size']).toEqual(['warn', { maxNumericValue: ceilings.domSizeMaxElements }]);
  expect(assertions['unused-javascript']).toEqual([
    'warn',
    { maxNumericValue: ceilings.unusedJavascriptMaxMs, maxLength: ceilings.unusedJavascriptMaxFiles },
  ]);
  expect(assertions['legacy-javascript']).toEqual([
    'warn',
    { maxNumericValue: ceilings.legacyJavascriptMaxMs, maxLength: ceilings.legacyJavascriptMaxFiles },
  ]);
}

describe('performance regression contract', () => {
  it('keeps npm performance scripts wired for static budgets and lighthouse on desktop and mobile', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>;
    };

    const scripts = packageJson.scripts ?? {};

    expect(scripts['test:performance:contracts']).toBe('node scripts/checks/performance-budgets.mjs');

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
    // 0.85 on desktop — root-caused with data (2026-07), not guessed. Local
    // Lighthouse desktop runs against the exact same build score speed-index
    // at 700–950ms (score ~0.98–1.0). Three separate CI runs on the same
    // commit (no app-code changes between them) measured speed-index at
    // 2100–2400ms — a 2–3x rendering slowdown characteristic of headless
    // Chrome on shared GitHub Actions runners, not a page regression. The
    // desktop scoring curve is unforgiving here: the *same* ~2130ms value
    // that scores 0.99 under mobile's curve scores only 0.56 under desktop's.
    // Speed Index carries ~10% of the performance category weight, so a
    // 0.56 sub-score alone costs ~4-5 points off the category total —
    // matching the observed 0.90/0.91/0.96 desktop category scores across
    // three otherwise-identical CI runs. 0.85 sits below the worst observed
    // floor (0.90) with margin for a bad-runner day, while numberOfRuns=3
    // (below) has LHCI take the median run instead of a single sample.
    //
    // Numeric ceilings (2026-07): desktop's 3 authoritative LHCI runs measured
    // dom-size 2689 elements, unused-javascript 70-80ms/2 files, legacy-
    // javascript 40ms/1 file. Ceilings below carry real headroom.
    expectStrictAssertions(lighthouseConfig.ci?.assert?.assertions ?? {}, 0.85, {
      domSizeMaxElements: 3200,
      unusedJavascriptMaxMs: 150,
      unusedJavascriptMaxFiles: 4,
      legacyJavascriptMaxMs: 100,
      legacyJavascriptMaxFiles: 3,
    });
  });

  it('keeps desktop Lighthouse at three runs (median absorbs CI rendering-speed variance)', () => {
    // Raised from 1 to 3 (2026-07): see the desktop-threshold comment above.
    // The variance is in Speed Index's *visual paint capture*, which is a
    // property of the runner's rendering hardware, not application code — so
    // unlike the 2026-07 IntroCurtain fix (which removed a real hydration-
    // wait bottleneck), there is no "fix the page" available here. Taking a
    // median across 3 runs protects the gate from a single unlucky sample.
    const lighthouseConfig = JSON.parse(read('lighthouserc.json')) as { ci?: { collect?: { numberOfRuns?: number } } };
    expect(lighthouseConfig.ci?.collect?.numberOfRuns).toBe(3);
  });

  it('keeps mobile Lighthouse at three runs, matching desktop sampling', () => {
    const lighthouseConfig = JSON.parse(read('lighthouserc.mobile.json')) as { ci?: { collect?: { numberOfRuns?: number } } };
    expect(lighthouseConfig.ci?.collect?.numberOfRuns).toBe(3);
  });

  it('keeps mobile lighthouse thresholds stricter than desktop, with mobile emulation', () => {
    const lighthouseConfig = JSON.parse(read('lighthouserc.mobile.json')) as LighthouseConfig;

    expect(lighthouseConfig.ci?.assert?.preset).toBe('lighthouse:recommended');
    // Mobile's scoring curve is far more forgiving of the same CI rendering
    // slowdown (the ~2130ms speed-index value that costs desktop ~10 points
    // scores 0.99 under mobile's curve) — observed mobile category scores
    // have held at 0.99 across every CI run in this investigation. 0.95
    // keeps a strict bar with a small margin, well above desktop's 0.85.
    //
    // Numeric ceilings (2026-07): mobile's 3 authoritative LHCI runs measured
    // dom-size 2672 elements, unused-javascript 50ms/2 files, legacy-
    // javascript 10ms/1 file — lower than desktop, so mobile's ceilings are
    // tighter (real headroom, not copy-pasted from desktop).
    expectStrictAssertions(lighthouseConfig.ci?.assert?.assertions ?? {}, 0.95, {
      domSizeMaxElements: 3200,
      unusedJavascriptMaxMs: 120,
      unusedJavascriptMaxFiles: 4,
      legacyJavascriptMaxMs: 60,
      legacyJavascriptMaxFiles: 3,
    });

    // Must actually emulate a mobile device — otherwise this is just desktop scoring twice.
    expect(lighthouseConfig.ci?.collect?.settings?.formFactor).toBe('mobile');
    expect(lighthouseConfig.ci?.collect?.settings?.screenEmulation?.mobile).toBe(true);
  });

  it('keeps pre-deployment verification wired to strict performance checks', () => {
    const verifyScript = read('scripts/verify/verify-deployment.sh');

    expect(verifyScript).toContain('pnpm run test:performance');
  });
});
