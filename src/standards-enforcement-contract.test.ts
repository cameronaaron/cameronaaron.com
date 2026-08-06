/**
 * Standards-enforcement meta-contract.
 *
 * ENGINEERING-STANDARDS.md's authority rests on one claim: every rule is
 * enforced by a contract, so nothing regresses silently. This sweep turns
 * that claim itself into a contract — three ways the standards/enforcement
 * pairing can silently rot, each checked directly:
 *
 *   1. Phantom enforcement: the docs cite a test or script file that no
 *      longer exists (renamed, deleted, or never created). A rule whose
 *      named enforcer is a dead reference is an unenforced rule wearing an
 *      enforced rule's clothes.
 *   2. Undocumented contracts: a `*contract*.test.*` file exists but neither
 *      CLAUDE.md nor ENGINEERING-STANDARDS.md mentions it, so future
 *      sessions can't discover what it guards or why — the knowledge lives
 *      only in the file itself, one refactor away from being lore.
 *   3. Registry decay: §9.4's watched-levers table is the mechanism keeping
 *      parked optimizations alive. A row missing its reopen condition or
 *      watcher is exactly the "decided → forgotten" failure §9.4 exists to
 *      prevent, so the table's shape is machine-checked.
 *
 * Same fix-the-source rule as every other contract: when this fails, restore
 * the file, document the contract, or complete the registry row — never
 * loosen the sweep.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const STANDARDS = readFileSync(join(ROOT, 'ENGINEERING-STANDARDS.md'), 'utf8');
const CLAUDE_MD = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
const DOCS_CORPUS = `${STANDARDS}\n${CLAUDE_MD}`;

function listFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files;
}

describe('standards-enforcement-contract — the standards themselves stay wired to real tests', () => {
  it('every test/script file cited in the docs exists on disk (no phantom enforcement)', () => {
    // Backticked citations only — that's the docs' own convention for naming
    // a real file (prose like "a contract test" is not a citation). Two
    // shapes: bare test filenames (`foo-contract.test.ts`) and repo-relative
    // script paths (`scripts/checks/foo.mjs`).
    const missing: string[] = [];

    const citedTests = new Set(
      [...DOCS_CORPUS.matchAll(/`([a-z0-9][a-z0-9./-]*\.test\.(?:ts|tsx))`/g)].map((m) => m[1]),
    );
    const actualTestBasenames = new Set(
      listFiles(join(ROOT, 'src'))
        .filter((f) => /\.test\.(ts|tsx)$/.test(f))
        .map((f) => f.split('/').pop()!),
    );
    for (const cited of citedTests) {
      const basename = cited.split('/').pop()!;
      if (!actualTestBasenames.has(basename)) {
        missing.push(`  \`${cited}\` — cited in docs, no such test file under src/`);
      }
    }

    const citedScripts = new Set([...DOCS_CORPUS.matchAll(/`(scripts\/[a-z0-9./-]+\.(?:mjs|sh))`/g)].map((m) => m[1]));
    for (const cited of citedScripts) {
      if (!existsSync(join(ROOT, cited))) {
        missing.push(`  \`${cited}\` — cited in docs, no such script file`);
      }
    }

    expect(
      missing,
      `${missing.length} phantom enforcement citation(s) — the docs name enforcers that don't exist. ` +
        `Restore the file or fix the citation:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('every contract test file is documented in CLAUDE.md or ENGINEERING-STANDARDS.md', () => {
    const contractFiles = listFiles(join(ROOT, 'src')).filter((f) => /contract[^/]*\.test\.(ts|tsx)$/.test(f));
    expect(contractFiles.length, 'contract sweep found nothing — check the filename filter').toBeGreaterThan(10);

    const undocumented = contractFiles
      .map((f) => f.split('/').pop()!)
      .filter((basename) => !DOCS_CORPUS.includes(basename.replace(/\.test\.(ts|tsx)$/, '')));

    expect(
      undocumented,
      `${undocumented.length} undocumented contract test(s) — add each to CLAUDE.md's test-structure ` +
        `list (or the relevant ENGINEERING-STANDARDS section) so its purpose survives outside the file:\n` +
        undocumented.map((name) => `  ${name}`).join('\n'),
    ).toEqual([]);
  });

  it('§9.4 watched-levers registry: every row carries lever, parked-because, reopens-when, and watcher', () => {
    const section = /### 9\.4[\s\S]*?(?=\n## |\n### |$)/.exec(STANDARDS)?.[0] ?? '';
    expect(section.length, '§9.4 missing from ENGINEERING-STANDARDS.md').toBeGreaterThan(0);

    const rows = section
      .split('\n')
      .filter((line) => line.startsWith('|'))
      // Drop the header row and the |---| separator row.
      .filter((line) => !/^\|\s*Lever\s*\|/.test(line) && !/^\|[\s|-]+\|$/.test(line));
    expect(rows.length, '§9.4 registry has lost its rows — the parked-lever table must survive edits').toBeGreaterThanOrEqual(7);

    const incomplete: string[] = [];
    for (const row of rows) {
      const cells = row
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length !== 4 || cells.some((cell) => cell.length < 3)) {
        incomplete.push(`  ${row.slice(0, 80)}…`);
      }
    }
    expect(
      incomplete,
      `§9.4 row(s) missing a cell — a parked lever without all of (parked because / reopens when / watcher) ` +
        `is "forgotten", not "decided":\n${incomplete.join('\n')}`,
    ).toEqual([]);
  });

  it('the pre-push gate includes the build + artifact budgets (pushes auto-deploy)', () => {
    // The RSC migration's HTML growth sat unflagged for five days because
    // performance-budgets.mjs only ran on the manual deploy path while every
    // push auto-deploys via Cloudflare Pages. The artifact gate must sit on
    // the push itself.
    const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      'simple-git-hooks'?: Record<string, string>;
    };
    const prePush = packageJson['simple-git-hooks']?.['pre-push'] ?? '';
    expect(prePush, 'pre-push hook must run a production build before the artifact budgets').toContain('run build');
    expect(prePush).toContain('performance-budgets.mjs');
  });

  it('leak detection is wired into both the local gate and CI (defense in depth)', () => {
    // A secret/PII leak caught at commit time never reaches a push; one
    // caught at push time never reaches GitHub; CI is the last independent
    // backstop if a hook was ever bypassed with --no-verify. All three tiers
    // matter — this repo went public in 2026-08 after finding real leaked
    // PII in history that predated this gate (see git log around that date).
    const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      'simple-git-hooks'?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const preCommit = packageJson['simple-git-hooks']?.['pre-commit'] ?? '';
    const prePush = packageJson['simple-git-hooks']?.['pre-push'] ?? '';
    expect(preCommit, 'pre-commit must scan staged changes for leaks before they ever get committed').toContain(
      'security:leaks:staged',
    );
    expect(prePush, 'pre-push must scan full history for leaks before anything reaches the remote').toContain(
      'security:leaks:history',
    );
    expect(packageJson.scripts?.['security:leaks:staged']).toBeTruthy();
    expect(packageJson.scripts?.['security:leaks:history']).toBeTruthy();

    const ciWorkflow = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    expect(ciWorkflow, 'CI must run gitleaks as an independent second pass').toContain('gitleaks/gitleaks-action');
  });
});
