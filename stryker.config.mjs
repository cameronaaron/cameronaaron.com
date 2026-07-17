// @ts-check
/**
 * Mutation testing (Stryker).
 *
 * Manual-only by design (ENGINEERING-STANDARDS.md §6 pattern for expensive
 * checks — see test:complexity, test:performance): a full run mutates every
 * production statement in the logic layer and re-runs only the tests that
 * cover it (coverageAnalysis: 'perTest'), which is still far slower than the
 * ~20s full Vitest suite. Never wired into pre-commit/pre-push or a blocking
 * CI job — run by hand with `pnpm run test:mutation` when you want to verify
 * a test suite actually fails when the behavior it claims to pin changes,
 * not just that it executes the line (100% coverage proves the latter, not
 * the former).
 *
 * Scope excludes src/data/** on purpose: those files are declarative content
 * catalogs (experience entries, testimonials, skills), not logic — mutating
 * a string literal in a company name produces no meaningful signal. Every
 * *.test.ts(x) file is excluded from mutation (only production code is
 * mutated); the co-located test file itself is still run against each mutant.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const strykerConfig = {
  packageManager: 'pnpm',
  // pnpm's node_modules layout doesn't resolve the default plugin glob
  // ("@stryker-mutator/*") reliably — load the runner explicitly.
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  // A dedicated config, not the real vitest.config.ts — see
  // vitest.config.stryker.ts for why (Stryker's instrumentation breaks this
  // repo's raw-source-text "contract" tests before any mutation even runs).
  vitest: {
    configFile: 'vitest.config.stryker.ts',
  },
  coverageAnalysis: 'perTest',
  // Known caveat (found and reproduced twice during setup, see
  // command-palette-logic.test.ts's "-Infinity to +Infinity" test): Stryker
  // has reported at least one mutant as "Survived" that a raw `vitest run` of
  // the identically-mutated source, bypassing Stryker's harness entirely,
  // proves the existing test suite actually kills. Reproduced under BOTH
  // 'perTest' and 'off', so it isn't a coverage-analysis attribution problem —
  // more likely a Stryker↔Vitest module-caching interaction. Treat a
  // "Survived" result as a strong lead, not gospel: for anything you're about
  // to spend real effort chasing, re-verify by applying the exact mutation to
  // the source by hand and running the affected test file directly before
  // concluding the test suite has a real gap.
  mutate: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.d.ts',
    '!src/data/**',
    // Confirmed 2026-07 (re-verified with a scoped `stryker run --mutate` pass,
    // not guessed): 49/49 survivors here are Framer Motion keyframe/easing/
    // duration literals in a decorative ambient-orb animation config (x/y/scale
    // arrays, 'easeInOut' strings, delay numbers) — a data catalog like
    // src/data/**, not logic. The only thing worth pinning (that these config
    // objects exist and have the right shape) is already covered; mutating an
    // easing curve or a keyframe number produces no meaningful test signal.
    '!src/components/ui/ambient-background-logic.ts',
  ],
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html',
  },
  jsonReporter: {
    fileName: 'reports/mutation/mutation.json',
  },
  thresholds: {
    high: 90,
    low: 70,
    // No break threshold — this gate is advisory/manual only (see header),
    // never fails the process regardless of score.
    break: null,
  },
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',
  tempDirName: '.stryker-tmp',
  concurrency: Math.max(1, Math.min(8, (await import('node:os')).cpus().length - 2)),
  timeoutMS: 15000,
};

export default strykerConfig;
