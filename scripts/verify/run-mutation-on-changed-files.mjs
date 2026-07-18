// Mutation testing, scoped to only the files this commit/push actually
// touches — the piece that makes Stryker fast enough to run on every commit
// (2026-07, owner mandate: mutation testing moved into the standard local
// gate once GitHub-hosted CI was turned off). A full-repo Stryker run stays
// available by hand via `pnpm run test:mutation`; this script exists purely
// to keep the hook itself proportional to the size of a single commit.
//
// "Changed files" is the union of:
//   - currently staged files (git diff --cached) — what pre-commit is about
//     to commit, before that commit exists
//   - the most recent commit's files (git diff HEAD~1 HEAD) — what pre-push
//     just committed, since nothing is staged anymore by the time pre-push
//     runs. Harmless overlap at pre-commit time (re-mutating an
//     already-verified previous commit costs a little time, not correctness).
//
// Scoped to LOGIC MODULES only (logic.ts / *-logic.ts / engine.ts /
// builders.ts — the same naming convention dead-logic-export-contract.test.ts
// keys off), not every changed .ts(x) file. Found empirically (2026-07,
// before this ever reached a real commit): scoping to ALL production .tsx
// files and running it against GlyphDissolveName.tsx / ReactionTimeGame.tsx
// scored 48% and 68% — nowhere near the 90% break threshold — not because
// those components are undertested, but because JSX rendering code is full
// of low-information mutations (`{' '}` -> `{''}`, a className ternary's
// unreachable-in-practice branch) that this repo's OWN modularization
// contract already explains: components are the thin "wiring" layer,
// deliberately kept free of the logic that's worth mutation-testing
// exhaustively, which lives in the co-located *-logic.ts module instead.
// Every 100%-mutation-score file in ENGINEERING-STANDARDS.md §6 item 13 is a
// logic/engine/builders file — never a component — for exactly this reason.
// Gating commits on component-file mutation scores would make the hook fail
// on ordinary UI work; gating on logic-file scores is the same bar this
// repo has always actually held itself to. `pnpm run test:mutation` (the
// full, manual, unscoped sweep) still covers component files too, for
// whoever wants to look at them by hand.
import { execFileSync } from 'node:child_process';

function gitDiffNames(args) {
  try {
    return execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', ...args], {
      encoding: 'utf8',
    })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const EXCLUDED_FILES = new Set(['src/components/ui/ambient-background-logic.ts']);
const LOGIC_FILE = /(^logic\.ts$|-logic\.ts$|^engine\.ts$|^builders\.ts$)/;

function isMutationRelevant(file) {
  if (!/^src\/.*\.ts$/.test(file)) return false;
  if (/\.test\.ts$/.test(file)) return false;
  if (file.endsWith('.d.ts')) return false;
  if (file.startsWith('src/data/')) return false;
  if (EXCLUDED_FILES.has(file)) return false;
  const basename = file.slice(file.lastIndexOf('/') + 1);
  return LOGIC_FILE.test(basename);
}

const changed = new Set([...gitDiffNames(['--cached']), ...gitDiffNames(['HEAD~1', 'HEAD'])]);
const files = [...changed].filter(isMutationRelevant);

if (files.length === 0) {
  console.log('[mutation] No changed production logic files — skipping Stryker.');
  process.exit(0);
}

console.log(`[mutation] Running Stryker on ${files.length} changed file(s):`);
for (const file of files) console.log(`  ${file}`);

try {
  execFileSync('pnpm', ['exec', 'stryker', 'run', '--mutate', files.join(',')], {
    stdio: 'inherit',
  });
  console.log('[mutation] No mutants survived above the configured threshold.');
} catch {
  console.error(
    '\n[mutation] Mutation score fell below the configured threshold — a surviving mutant ' +
      'means a test executes that code without actually asserting its effect.',
  );
  console.error(
    '[mutation] Fix the test to pin the real behavior, or if this is a genuine equivalent ' +
      'mutant (see ENGINEERING-STANDARDS.md §6 item 13 for worked examples), document it ' +
      'inline at the source and in that section, then re-run.',
  );
  process.exit(1);
}
