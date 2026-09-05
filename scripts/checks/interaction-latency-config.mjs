/**
 * Pure config for the input-latency gate — budgets and the representative-
 * interaction list, with no side effects (no fs reads, no Playwright import)
 * so it can be imported both by the real measurement engine
 * (measure-interaction-latency.mjs, Node-only) and by the fast, offline
 * wiring test (src/interaction-latency-contract.test.ts, runs under Vitest).
 */

export const INP_BUDGET_MS = 100;
/** Documentation only — PerformanceObserver's `longtask` entry type is
 *  defined as >50ms by the spec itself; any entry at all is a violation. */
export const LONG_TASK_THRESHOLD_MS = 50;
/** Real-browser interaction timing is genuinely noisy run to run (confirmed
 *  by hand — the same interaction reported 80ms, 96ms, and 128ms across
 *  three otherwise-identical runs). Same fix this repo already applies to
 *  Lighthouse (lighthouserc.json's numberOfRuns: 3, ENGINEERING-STANDARDS.md
 *  §4.7): more samples stabilize how reliably a value is measured, so take
 *  the median of several runs instead of trusting one. */
export const RUNS_PER_INTERACTION = 3;

export const INTERACTIONS = [
  {
    name: 'Hero world switch',
    file: 'src/components/Hero.tsx',
    viewport: { width: 1400, height: 1000 },
    run: async (page) => {
      await page.getByRole('tab', { name: 'Security', exact: false }).click();
    },
  },
  {
    name: 'Mobile menu toggle',
    file: 'src/components/Navigation.tsx',
    viewport: { width: 390, height: 844 },
    run: async (page) => {
      await page.getByRole('button', { name: /navigation menu/i }).click();
    },
  },
  {
    name: 'Testimonials relationship filter',
    file: 'src/components/Testimonials.tsx',
    viewport: { width: 1400, height: 1000 },
    run: async (page) => {
      await page.locator('#testimonials button[aria-pressed="false"]').first().click();
    },
  },
  {
    name: 'Skills sort-view toggle',
    file: 'src/components/Skills.tsx',
    viewport: { width: 1400, height: 1000 },
    run: async (page) => {
      await page.getByRole('button', { name: 'Alphabetical' }).click();
    },
  },
];

// Known gap, not silently dropped: three interactions reproducibly never
// produced a web-vitals INP reading across repeated hand-verification runs
// (0/3) — CommandPalette and KeyboardShortcuts (both steal focus into a
// modal via `inputRef.current?.focus()`/similar on open) and BackToTop
// (revealed by a scroll immediately before the click, which may be
// confusing the interaction grouping). Every interaction above this comment
// doesn't do either of those things and reported reliably (2-3/3). Left out
// of this floor rather than shipped as a false-negative "PASS" on missing
// data; worth its own investigation before adding scroll- or modal-adjacent
// interactions to this suite.
