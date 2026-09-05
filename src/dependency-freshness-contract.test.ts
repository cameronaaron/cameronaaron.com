/**
 * Dependency freshness contract.
 *
 * Enforces five invariants that must hold at all times:
 *   1. Every direct and transitive package is at its latest published version.
 *   2. There are zero known security vulnerabilities in the dependency tree.
 *   3. The wrangler CLI binary in node_modules/.bin matches the version declared
 *      in package.json devDependencies — prevents stale global tools from silently
 *      being used instead of the project-managed one.
 *   4. pnpm-lock.yaml's recorded specifiers are in sync with package.json / the
 *      pnpm-workspace.yaml overrides — verified against a clean install, not the
 *      developer's existing node_modules (see the note on that test below).
 *   5. pnpm-workspace.yaml's minimumReleaseAgeExclude entries name the exact
 *      versions actually resolved in pnpm-lock.yaml — a manually-maintained
 *      side-channel that `pnpm update --latest` never touches, so it silently
 *      drifts every time one of the pinned tools is upgraded (see that test).
 *
 * Failure messages name the offending packages so the fix is one command away.
 *
 * To fix outdated:     pnpm update --latest
 * To fix CVEs:        check pnpm audit output; add overrides to pnpm-workspace.yaml if needed
 * To fix wrangler:    pnpm install  (re-syncs node_modules to pnpm-lock.yaml)
 * To fix lockfile sync: pnpm install  (rewrites the stale specifier)
 * To fix stale exclude entries: edit pnpm-workspace.yaml to match the versions
 *   named in the failure message
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const PNPM = 'pnpm';

function run(args: string[], cwd: string = ROOT): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(PNPM, args, { encoding: 'utf8', cwd });
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', status: result.status };
}

/** Compare a "X.Y.Z" version string against a [major, minor, patch] bound:
 *  negative below, 0 equal, positive above. */
function compareVersions(version: string, bound: [number, number, number]): number {
  const parts = version.split('.').map((part) => Number.parseInt(part, 10));
  for (let i = 0; i < 3; i += 1) {
    const value = parts[i] ?? 0;
    if (value !== bound[i]) return value < bound[i] ? -1 : 1;
  }
  return 0;
}

// ─── outdated ────────────────────────────────────────────────────────────────

/**
 * Deliberate, documented pins — packages held back from latest because the
 * surrounding toolchain cannot support the newest release yet. Every entry is
 * a decision on record with the blocking reason and a revisit condition.
 *
 * Self-cleaning: if a pinned package stops appearing in `pnpm outdated`
 * (i.e. the pin caught up to latest, or the package was removed), the test
 * FAILS and demands the entry be deleted — an exemption can never silently
 * outlive its reason.
 */
const PINNED_WITH_REASON: Record<string, string> = {
  // 2026-07: every released @typescript-eslint/typescript-estree — including
  // the 8.63.1 alphas — declares peer `typescript >=4.8.4 <6.1.0` and crashes
  // on TS 7's removed ts.ModuleKind API, which breaks `npm run lint` entirely.
  // Unpin when typescript-eslint ships TypeScript 7 support.
  typescript: 'typescript-eslint peers typescript <6.1.0; TS 7 breaks eslint',
  // 2026-09: Vitest 5 silently destroys mutation testing. Stryker's
  // @stryker-mutator/vitest-runner@10.0.0 (latest) activates a RUNTIME mutant
  // by assigning `ns.activeMutant` inside a `beforeAll` registered at the top
  // level of its injected setup file. Under Vitest 5 that hook never fires and
  // the setup file's globalThis is not the one the instrumented module reads,
  // so no runtime mutant is ever switched on and EVERY function-body mutant is
  // reported "Survived". Only module-level (static) mutants still die, via the
  // instrumented `__STRYKER_ACTIVE_MUTANT__` env fallback read at import.
  // Measured on identical source and tests (src/components/hero/hero-logic.ts):
  //   vitest 4.1.11 → 100.00% (62 killed / 0 survived)
  //   vitest 5.0.0  →  20.97% (13 killed / 49 survived)
  // The failure is silent — it produces a plausible low score, not an error —
  // so it reads as "your tests are weak" and invites exactly the wrong fix.
  // Unpin when the vitest-runner supports Vitest 5 (see the probe below).
  vitest: 'stryker vitest-runner cannot activate runtime mutants on Vitest 5',
  '@vitest/coverage-istanbul': 'must match the pinned vitest major',
  '@vitest/coverage-v8': 'must match the pinned vitest major',
};

describe('dependency-freshness-contract — bleeding edge, zero CVEs', () => {
  it('pnpm outdated: zero stale packages — all deps must be at latest published version', () => {
    const { stdout, status } = run(['outdated', '--json']);

    // pnpm outdated exits 0 + prints "{}" when everything is current.
    // exits 1 + prints populated JSON when any package is behind.
    const report: Record<string, { current: string; latest: string; dependencyType?: string }> =
      stdout.trim() ? JSON.parse(stdout) : {};

    const stale: string[] = [];
    for (const [name, info] of Object.entries(report)) {
      if (name in PINNED_WITH_REASON) continue;
      stale.push(`  ${name} (${info.dependencyType ?? 'dependency'}): ${info.current} → ${info.latest}`);
    }

    expect(
      stale,
      `${stale.length} stale package(s) — run "pnpm update --latest" to fix:\n${stale.join('\n')}`,
    ).toHaveLength(0);

    // Self-cleaning check: every documented pin must still be doing work.
    for (const name of Object.keys(PINNED_WITH_REASON)) {
      expect(
        report[name],
        `"${name}" has a PINNED_WITH_REASON entry but is no longer behind latest — delete the entry`,
      ).toBeDefined();
    }

    // Belt-and-suspenders: with no pins, exit code 0 means clean regardless of
    // JSON parsing. With documented pins present, pnpm outdated legitimately
    // exits 1 for exactly those packages — the filtered list above is the gate.
    if (Object.keys(PINNED_WITH_REASON).length === 0) {
      expect(status, 'pnpm outdated exited non-zero; run "pnpm update --latest"').toBe(0);
    }
  }, 30_000);

  // ─── pin compatibility probes ───────────────────────────────────────────────

  it('typescript pin: fails the moment typescript-eslint ships support for the latest TypeScript', () => {
    // The pin exists ONLY because typescript-estree's peer range excludes the
    // latest TypeScript. This probe checks that blocking condition directly
    // against the registry on every run — so the pin announces its own removal
    // the day compatibility lands, instead of waiting for someone to remember.
    expect(
      'typescript' in PINNED_WITH_REASON,
      'the typescript pin was removed — delete this probe in the same commit',
    ).toBe(true);

    const peerRange = run(['view', '@typescript-eslint/typescript-estree', 'peerDependencies.typescript'])
      .stdout.trim();
    expect(peerRange, 'could not read typescript-estree peer range from the registry').not.toBe('');

    const latestTs = run(['view', 'typescript', 'version']).stdout.trim();
    expect(latestTs, 'could not read latest typescript version from the registry').toMatch(/^\d+\.\d+\.\d+/);

    // The peer range blocks latest TS only while it carries an upper bound
    // (e.g. "<6.1.0") at or below the latest version.
    const upperBound = peerRange.match(/<\s*(\d+)\.(\d+)\.(\d+)/);
    const stillBlocked =
      upperBound !== null &&
      compareVersions(latestTs, [Number(upperBound[1]), Number(upperBound[2]), Number(upperBound[3])]) >= 0;

    expect(
      stillBlocked,
      `typescript-eslint now supports typescript@${latestTs} (peer range "${peerRange}") — ` +
        'remove the typescript PINNED_WITH_REASON entry, delete this probe, and run "pnpm update --latest typescript"',
    ).toBe(true);
  }, 30_000);

  it('vitest pin: fails the moment a new stryker vitest-runner ships, forcing a Vitest 5 re-test', () => {
    // The pin exists ONLY because @stryker-mutator/vitest-runner cannot activate
    // runtime mutants under Vitest 5. Unlike the typescript pin, the blocking
    // condition is NOT expressible as a peer range — the runner already declares
    // `vitest: >=2.0.0`, which nominally allows 5 and is precisely why the
    // breakage is silent. So the tripwire is the runner's own version: any
    // release past the one this diagnosis was made against is a reason to
    // re-run the A/B before trusting a single mutation score again.
    expect(
      'vitest' in PINNED_WITH_REASON,
      'the vitest pin was removed — delete this probe in the same commit',
    ).toBe(true);

    const DIAGNOSED_AGAINST = [10, 0, 0] as const;

    const latestRunner = run(['view', '@stryker-mutator/vitest-runner', 'version']).stdout.trim();
    expect(latestRunner, 'could not read latest vitest-runner version from the registry').toMatch(/^\d+\.\d+\.\d+/);

    expect(
      compareVersions(latestRunner, DIAGNOSED_AGAINST) <= 0,
      `@stryker-mutator/vitest-runner@${latestRunner} is newer than the ` +
        `${DIAGNOSED_AGAINST.join('.')} this pin was diagnosed against. Re-run the A/B before trusting any ` +
        'mutation score: `pnpm add -D vitest@latest @vitest/coverage-istanbul@latest @vitest/coverage-v8@latest` ' +
        'then `pnpm exec stryker run --mutate src/components/hero/hero-logic.ts` (expect 100%, 62 killed — ' +
        'anything near 20% means runtime mutants still are not activating). If it passes, drop the vitest, ' +
        '@vitest/coverage-istanbul and @vitest/coverage-v8 entries from PINNED_WITH_REASON, delete this probe, ' +
        'and remove the ENGINEERING-STANDARDS.md §9.4 registry row in the same commit.',
    ).toBe(true);
  }, 30_000);

  // ─── packageManager freshness ────────────────────────────────────────────────

  it('packageManager: the pnpm pin in package.json is the latest published pnpm', () => {
    // package.json's packageManager field is its own one-entry ecosystem —
    // `pnpm outdated` never inspects it, so it drifts silently (the exact
    // GitHub-Actions lesson again). CI and corepack both obey this pin.
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { packageManager?: string };
    const pinMatch = /^pnpm@(\d+\.\d+\.\d+)$/.exec(pkg.packageManager ?? '');
    expect(pinMatch, 'package.json packageManager must pin an exact pnpm version (pnpm@X.Y.Z)').not.toBeNull();

    const latestPnpm = run(['view', 'pnpm', 'version']).stdout.trim();
    expect(latestPnpm, 'could not read latest pnpm version from the registry').toMatch(/^\d+\.\d+\.\d+/);

    expect(
      pinMatch![1],
      `packageManager pins pnpm@${pinMatch![1]} but latest is ${latestPnpm} — update package.json's packageManager field`,
    ).toBe(latestPnpm);
  }, 30_000);

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

    // Count the advisories list, not metadata.vulnerabilities: pnpm's
    // auditConfig.ignoreGhsas (the documented-override mechanism this test's
    // own failure message points at) filters `advisories` but leaves the raw
    // metadata counts untouched, so a reasoned ignore would never be able to
    // pass on metadata. Undocumented advisories still appear in `advisories`
    // and still fail here.
    const total = advisories.length;

    expect(
      total,
      `${total} security advisory/advisories found — fix or override in pnpm-workspace.yaml:\n${lines.join('\n')}`,
    ).toBe(0);

    expect(status, 'pnpm audit exited non-zero; run "pnpm audit" to review').toBe(0);
  }, 30_000);

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
    // Delegates to scripts/verify/verify-lockfile-sync.mjs (single source of
    // truth — see that file for why this must run as a direct `node`
    // invocation, never wrapped in a `pnpm run <script>` alias). Invoked here
    // the same way, via a raw node child process rather than through pnpm,
    // so this test can't fall into the exact trap it exists to catch.
    const result = spawnSync('node', [join(ROOT, 'scripts/verify/verify-lockfile-sync.mjs')], {
      encoding: 'utf8',
      cwd: ROOT,
    });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  }, 60_000);

  // ─── minimumReleaseAgeExclude, kept honest against the real lockfile ─────────

  it('pnpm-workspace.yaml minimumReleaseAgeExclude names versions that are actually resolved', () => {
    // This exclude list is how the Cloudflare toolchain (workerd/miniflare/
    // wrangler) opts out of pnpm's minimum-release-age supply-chain guard, so
    // this repo can track its bleeding-edge releases immediately. Nothing
    // keeps it in sync automatically: `pnpm update --latest` bumps
    // package.json/pnpm-lock.yaml but has no reason to touch this file, so
    // every time one of these tools is upgraded, the exclude entry for it
    // silently points at a version that no longer exists in the lockfile
    // (found 2026-07: all eight entries were a full release behind). A stale
    // entry doesn't error — it's simply not exempting the version that's
    // actually installed, quietly reintroducing the age-gate delay it was
    // meant to bypass.
    const workspaceYaml = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
    const lockfile = readFileSync(join(ROOT, 'pnpm-lock.yaml'), 'utf8');

    // Scope the parse to the minimumReleaseAgeExclude block — the file also
    // holds other YAML lists (e.g. auditConfig.ignoreGhsas) whose entries are
    // not package@version specs and must not enter this sweep.
    const excludeBlock = /^minimumReleaseAgeExclude:\n((?:\s+-[^\n]*\n)+)/m.exec(workspaceYaml)?.[1] ?? '';
    const excludeEntries = [...excludeBlock.matchAll(/^\s*-\s*['"]?([^'"\s#]+)['"]?\s*$/gm)].map((m) => m[1]);
    expect(excludeEntries.length, 'minimumReleaseAgeExclude sweep found nothing — check the parsing regex').toBeGreaterThan(0);

    const stale: string[] = [];
    for (const entry of excludeEntries) {
      const atIndex = entry.lastIndexOf('@');
      const name = entry.slice(0, atIndex);
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const resolvedVersions = [...lockfile.matchAll(new RegExp(`^\\s*['"]?${escapedName}@([\\w.-]+)['"]?:\\s*$`, 'gm'))].map(
        (m) => m[1],
      );

      if (resolvedVersions.length === 0) {
        stale.push(`  ${entry} — "${name}" not found in pnpm-lock.yaml at all (renamed or removed?)`);
      } else if (!resolvedVersions.includes(entry.slice(atIndex + 1))) {
        stale.push(`  ${entry} → lockfile actually has ${name}@${resolvedVersions.join(', ')}`);
      }
    }

    expect(
      stale,
      `${stale.length} stale minimumReleaseAgeExclude entr(y/ies) in pnpm-workspace.yaml — ` +
        `update them to match the versions pnpm-lock.yaml actually resolved:\n${stale.join('\n')}`,
    ).toHaveLength(0);
  });
});
