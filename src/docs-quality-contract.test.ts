/**
 * Docs quality contract.
 *
 * The repo's markdown (CLAUDE.md, ENGINEERING-STANDARDS.md, README.md,
 * meoninternet.md) is operational documentation — agents and humans follow it
 * verbatim. A 2026-07 audit found 138 accumulated markdownlint violations
 * (hard tabs, bare URLs, unstyled tables, unlabeled code fences) that nothing
 * was watching: warnings-only tooling rots exactly like unwatched
 * dependencies.
 *
 * This contract runs markdownlint-cli2 (config: .markdownlint-cli2.jsonc —
 * every default rule except line-length MD013 and inline-HTML MD033, both
 * disabled with documented reasons) and fails on ANY violation. It also
 * asserts the wiring: `pnpm run lint` must include both eslint with
 * --max-warnings=0 (warnings are failures, not noise) and the markdown lint,
 * so the pre-push hook and CI inherit the same zero-warning bar.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());

describe('docs-quality-contract — zero markdown violations', () => {
  it('markdownlint-cli2 reports zero errors across all root markdown files', () => {
    const result = spawnSync('pnpm', ['exec', 'markdownlint-cli2', '*.md'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(
      result.status,
      `markdownlint violations — run "pnpm run lint:fix" then fix the rest by hand:\n${result.stdout}${result.stderr}`,
    ).toBe(0);
  }, 30_000);

  it('the markdownlint config exists and documents its deliberate exceptions', () => {
    const configPath = join(ROOT, '.markdownlint-cli2.jsonc');
    expect(existsSync(configPath), '.markdownlint-cli2.jsonc must exist at the repo root').toBe(true);
    const config = readFileSync(configPath, 'utf8');
    // Disabled rules must carry an explanation — an exception is a decision
    // on record, not a loophole (same policy as every allowlist here).
    expect(config).toContain('MD013');
    expect(config).toContain('intentional');
  });

  it('pnpm run lint enforces zero warnings and includes the markdown lint', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const lint = pkg.scripts?.lint ?? '';
    expect(lint, 'eslint must run with --max-warnings=0 — a warning is a failure').toContain('--max-warnings=0');
    expect(lint, 'lint must include lint:md so docs rot fails the gate').toContain('lint:md');
    expect(pkg.scripts?.['lint:md'] ?? '', 'lint:md must run markdownlint-cli2').toContain('markdownlint-cli2');
  });
});
