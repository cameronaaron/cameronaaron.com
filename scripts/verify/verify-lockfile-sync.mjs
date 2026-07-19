// Verifies pnpm-lock.yaml is in sync with package.json / pnpm-workspace.yaml
// overrides, using the same strict check CI runs first on every job:
// `pnpm install --frozen-lockfile`.
//
// This cannot be done in-place against the repo's real node_modules: pnpm
// short-circuits that check to "Already up to date" once node_modules already
// satisfies the lockfile, silently skipping specifier validation — that's how
// a stale postcss specifier (left by a `pnpm update --latest` that didn't
// reconcile a pnpm-workspace.yaml override) passed every local check while
// still breaking CI and the Cloudflare Pages auto-deploy on push.
//
// It also cannot run via `pnpm run <anything>` first in a hook chain: pnpm's
// own "run" lifecycle silently repairs a drifted pnpm-lock.yaml in place
// before executing the script, which launders the exact drift this exists to
// catch. This script must be invoked directly (see the pre-push hook in
// package.json) as the very first command, before any other pnpm command has
// a chance to touch the lockfile.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const scratchDir = mkdtempSync(join(tmpdir(), 'lockfile-sync-check-'));

try {
  for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
    cpSync(join(root, file), join(scratchDir, file));
  }

  // pnpm-workspace.yaml's patchedDependencies references files under patches/
  // by relative path (e.g. patches/next@16.2.10.patch) — pnpm hashes that
  // file during `install --frozen-lockfile` even with --ignore-scripts, so
  // it must exist in the scratch dir too or the check fails with an
  // unrelated-looking ENOENT instead of a real drift signal.
  const patchesDir = join(root, 'patches');
  if (existsSync(patchesDir)) {
    cpSync(patchesDir, join(scratchDir, 'patches'), { recursive: true });
  }

  execFileSync('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts'], {
    cwd: scratchDir,
    stdio: 'inherit',
  });

  console.log('✓ pnpm-lock.yaml is in sync with package.json');
} catch {
  console.error(
    '\n✗ pnpm-lock.yaml is out of sync with package.json (this is exactly what CI\'s ' +
      '"pnpm install --frozen-lockfile" step on a fresh checkout, and Cloudflare Pages\' ' +
      'auto-deploy, will hit). Run "pnpm install" to resync, then commit the updated ' +
      'pnpm-lock.yaml.',
  );
  process.exitCode = 1;
} finally {
  rmSync(scratchDir, { recursive: true, force: true });
}
