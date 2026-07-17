import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest config for Stryker mutation testing only (see stryker.config.mjs).
 *
 * Stryker instruments (rewrites) every mutated source file on disk. This repo
 * has ~28 "contract" tests that read production source files as raw TEXT to
 * pin repo-wide conventions (e.g. "no map().filter()", "every animate:
 * Infinity gates on a motion check") — they assert on literal source content,
 * not runtime behavior of a specific unit. Stryker's instrumentation changes
 * that literal content even before any mutation is switched on, so these
 * tests fail Stryker's own dry run (confirmed: algorithm-and-datastructure-
 * contract.test.tsx failed on a `Math.round(width * dpr)` substring check
 * against an instrumented BackgroundParticles.tsx). Excluding them here loses
 * no mutation-catching power — a mutant changing runtime behavior doesn't
 * change whether a textual pattern exists, so these tests were never going to
 * kill a behavioral mutant. Every genuine behavioral/unit test file stays in
 * scope; only this static-analysis category is excluded, and only for the
 * mutation-testing run (the real `vitest.config.ts` used by `npm test` is
 * unaffected).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      'src/app/a11y-regressions.test.tsx',
      'src/app/llms-txt.test.ts',
      'src/app/mcp-json.test.ts',
      'src/app/section-reveal-bfcache.test.ts',
      'src/app/wcag-contract.test.tsx',
      'src/complexity-doctrine-contract.test.ts',
      'src/components/algorithm-and-datastructure-contract.test.tsx',
      'src/components/animation-regression-contract.test.ts',
      'src/components/mobile-regression-contract.test.tsx',
      'src/components/ssr-hydration-safety.test.tsx',
      'src/config-integrity-contract.test.ts',
      'src/coverage-provider-contract.test.ts',
      'src/data/meoninternet-integration.test.ts',
      'src/dead-component-contract.test.ts',
      'src/dead-dependency-contract.test.ts',
      'src/dead-logic-export-contract.test.ts',
      'src/dependency-freshness-contract.test.ts',
      'src/docs-quality-contract.test.ts',
      'src/external-links-contract.test.ts',
      'src/github-actions-freshness-contract.test.ts',
      'src/headers-integrity-contract.test.ts',
      'src/lifecycle-hygiene-contract.test.ts',
      'src/modularization-contract.test.ts',
      'src/module-testability-contract.test.ts',
      'src/performance-regression-contract.test.ts',
      'src/public-assets-freshness-contract.test.ts',
      'src/route-deployment-regression.test.ts',
      'src/ssr-hydration-contract.test.ts',
      'src/test-quality-contract.test.tsx',
      'src/repo-hygiene-contract.test.ts',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
