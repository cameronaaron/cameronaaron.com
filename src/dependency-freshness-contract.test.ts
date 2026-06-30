/**
 * Dependency freshness contract.
 *
 * Enforces three invariants that must hold at all times:
 *   1. Every direct and transitive package is at its latest published version.
 *   2. There are zero known security vulnerabilities in the dependency tree.
 *   3. The wrangler CLI binary in node_modules/.bin matches the version declared
 *      in package.json devDependencies — prevents stale global tools from silently
 *      being used instead of the project-managed one.
 *
 * Failure messages name the offending packages so the fix is one command away.
 *
 * To fix outdated:     pnpm update --latest
 * To fix CVEs:        check pnpm audit output; add overrides to pnpm-workspace.yaml if needed
 * To fix wrangler:    pnpm install  (re-syncs node_modules to pnpm-lock.yaml)
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const PNPM = 'pnpm';

function run(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(PNPM, args, { encoding: 'utf8', cwd: ROOT });
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
});
