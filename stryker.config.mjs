// @ts-check
/**
 * Mutation testing (Stryker).
 *
 * Standard in the pre-commit/pre-push gate as of 2026-07 (owner mandate,
 * once GitHub-hosted CI was turned off to cut cost — local hooks became the
 * only gate, so they now carry the full weight this repo holds itself to).
 * `pnpm run test:mutation` still runs the FULL scope defined here — that
 * remains a manual, whole-codebase command for periodic sweeps (still far
 * slower than the ~20s Vitest suite). The hook itself never runs this full
 * scope: `scripts/verify/run-mutation-on-changed-files.mjs` scopes every
 * commit/push to just the files that commit/push actually touches (via
 * `--mutate`), which is what keeps it fast enough to run on every commit.
 * A full run mutates every production statement in the logic layer and
 * re-runs only the tests that cover it (coverageAnalysis: 'perTest').
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
    // Raised 2026-07: every logic-heavy file actually swept so far
    // (predator-prey-logic.ts, reaction-time-game-logic.ts,
    // glyph-dissolve-logic.ts, and the five files listed in
    // ENGINEERING-STANDARDS.md §6 item 13) has landed at 100%, or one
    // hand-verified equivalent mutant away from it — 90/70 undersold what
    // this codebase actually holds itself to.
    high: 100,
    low: 90,
    // Blocking as of 2026-07 (see header) — a scoped run whose survivors push
    // the changed file(s) below 90% fails the commit/push. 90, not 100: a
    // file can carry one or two hand-verified equivalent mutants forever
    // (documented at their source and in ENGINEERING-STANDARDS.md §6 item 13)
    // without every unrelated future commit to that file tripping the gate.
    break: 90,
  },
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',
  tempDirName: '.stryker-tmp',
  concurrency: Math.max(1, Math.min(8, (await import('node:os')).cpus().length - 2)),
  timeoutMS: 15000,
};

export default strykerConfig;
