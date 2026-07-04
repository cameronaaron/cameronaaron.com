/**
 * Dependency freshness contract.
 *
 * Enforces four invariants that must hold at all times:
 *   1. Every direct and transitive package is at its latest published version.
 *   2. There are zero known security vulnerabilities in the dependency tree.
 *   3. The wrangler CLI binary in node_modules/.bin matches the version declared
 *      in package.json devDependencies — prevents stale global tools from silently
 *      being used instead of the project-managed one.
 *   4. pnpm-lock.yaml's recorded specifiers are in sync with package.json / the
 *      pnpm-workspace.yaml overrides — verified against a clean install, not the
 *      developer's existing node_modules (see the note on that test below).
 *
 * Failure messages name the offending packages so the fix is one command away.
 *
 * To fix outdated:     pnpm update --latest
 * To fix CVEs:        check pnpm audit output; add overrides to pnpm-workspace.yaml if needed
 * To fix wrangler:    pnpm install  (re-syncs node_modules to pnpm-lock.yaml)
 * To fix lockfile sync: pnpm install  (rewrites the stale specifier)
 */
import { readFileSync, mkdtempSync, rmSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const PNPM = 'pnpm';

function run(args: string[], cwd: string = ROOT): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(PNPM, args, { encoding: 'utf8', cwd });
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', status: result.status };
}

// ─── outdated ────────────────────────────────────────────────────────────────

describe('dependency-freshness-contract — bleeding edge, zero CVEs', () => {
  it('pnpm outdated: zero stale packages — all deps must be at latest published version', () => {
    const { stdout, status } = run(['outdated', '--json']);

    // pnpm outdated exits 0 + prints "{}" when everything is current.
    // exits 1 + prints populated JSON when any package is behind.
    const report: Record<string, { current: string; latest: string; dependencyType?: string }> =
      stdout.trim() ? JSON.parse(stdout) : {};

    const stale = Object.entries(report).map(
      ([name, info]) =>
        `  ${name} (${info.dependencyType ?? 'dependency'}): ${info.current} → ${info.latest}`,
    );

    expect(
      stale,
      `${stale.length} stale package(s) — run "pnpm update --latest" to fix:\n${stale.join('\n')}`,
    ).toHaveLength(0);

    // Belt-and-suspenders: exit code 0 means clean regardless of JSON parsing.
    expect(status, 'pnpm outdated exited non-zero; run "pnpm update --latest"').toBe(0);
  });

  // ─── audit ─────────────────────────────────────────────────────────────────

  it('pnpm audit: zero security advisories across all dependencies', () => {
    const { stdout, status } = run(['audit', '--json']);

    interface Advisory {
      title: string;
      module_name: string;
      severity: string;
      url: string;
    }
    interface AuditReport {
      advisories?: Record<string, Advisory>;
      metadata?: { vulnerabilities?: Record<string, number> };
    }

    const report: AuditReport = stdout.trim() ? JSON.parse(stdout) : {};
    const advisories = Object.values(report.advisories ?? {});

    const lines = advisories.map(
      (a) =>
        `  [${a.severity.toUpperCase()}] ${a.module_name}: ${a.title}\n    ${a.url}`,
    );

    const vulnCounts = report.metadata?.vulnerabilities ?? {};
    const total = Object.values(vulnCounts).reduce((s, n) => s + n, 0);

    expect(
      total,
      `${total} security advisory/advisories found — fix or override in pnpm-workspace.yaml:\n${lines.join('\n')}`,
    ).toBe(0);

    expect(status, 'pnpm audit exited non-zero; run "pnpm audit" to review').toBe(0);
  });

  // ─── wrangler CLI version ──────────────────────────────────────────────────

  it('wrangler CLI in node_modules/.bin matches the version declared in package.json', () => {
    // Prevents the class of bug where a stale global wrangler (e.g. homebrew)
    // silently takes precedence over the project-managed version. This test
    // verifies the local binary is installed and matches package.json — so
    // npm scripts and CI always run the correct version.
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      devDependencies?: Record<string, string>;
    };

    const declared = (pkg.devDependencies?.wrangler ?? '').replace(/^\^|~/, '');
    expect(declared, 'wrangler not found in devDependencies').toBeTruthy();

    const result = spawnSync(join(ROOT, 'node_modules/.bin/wrangler'), ['--version'], {
      encoding: 'utf8',
      cwd: ROOT,
    });

    const installed = result.stdout.trim().replace(/^wrangler\s+/i, '').split(/\s/)[0] ?? '';

    expect(
      installed,
      `node_modules/.bin/wrangler version "${installed}" does not match package.json "${declared}".\n` +
        'Run "pnpm install" to sync, or "pnpm update --latest wrangler" to upgrade.',
    ).toBe(declared);
  });

  // ─── lockfile/manifest sync, verified against a clean install ────────────────

  it('pnpm-lock.yaml is in sync with package.json — verified against a clean install', () => {
    // `pnpm install --frozen-lockfile` against the *existing* node_modules is not
    // a reliable check: pnpm short-circuits to "Already up to date" once
    // node_modules already satisfies the lockfile, silently skipping the
    // specifier-mismatch validation. That let a stale `postcss` specifier
    // (left behind by a `pnpm update --latest` that didn't reconcile a
    // pnpm-workspace.yaml override) pass every local check while still
    // failing on CI's checkout, which always starts from zero node_modules —
    // it broke every downstream CI job, including both Lighthouse gates,
    // before they could even start. Reproducing the clean-install condition
    // here, in a scratch directory seeded only with the three manifest files,
    // catches the same class of drift locally before it ever reaches CI.
    const scratchDir = mkdtempSync(join(tmpdir(), 'lockfile-sync-check-'));
    try {
      cpSync(join(ROOT, 'package.json'), join(scratchDir, 'package.json'));
      cpSync(join(ROOT, 'pnpm-lock.yaml'), join(scratchDir, 'pnpm-lock.yaml'));
      cpSync(join(ROOT, 'pnpm-workspace.yaml'), join(scratchDir, 'pnpm-workspace.yaml'));

      const { stderr, status } = run(['install', '--frozen-lockfile', '--ignore-scripts'], scratchDir);

      expect(
        status,
        `pnpm-lock.yaml is out of sync with package.json (this is exactly what CI's ` +
          `"pnpm install --frozen-lockfile" step on a fresh checkout will hit). ` +
          `Run "pnpm install" to resync, then commit the updated pnpm-lock.yaml.\n\n${stderr}`,
      ).toBe(0);
    } finally {
      rmSync(scratchDir, { recursive: true, force: true });
    }
  }, 60_000);
});
