/**
 * Dead dependency contract.
 *
 * dead-logic-export-contract asks whether an exported function has a real
 * caller; this asks the same question one level up the stack — does every
 * package in package.json's dependencies/devDependencies have a real
 * consumer anywhere in the repo?
 *
 * The failure mode it closes (found 2026-07): `beasties` sat in
 * devDependencies for months after the postbuild step that used it was
 * reverted (a critical-CSS experiment that regressed mobile CLS — see
 * ENGINEERING-STANDARDS §4.7). Auditing the full dependency list the same
 * day surfaced four more with zero real references anywhere: `playwright`
 * (a11y scripts run `npx pa11y`, not the Playwright API), `autoprefixer`
 * (Tailwind v4's bundled Lightning CSS vendor-prefixes on its own),
 * `baseline-browser-mapping`, and `@opennextjs/cloudflare` (leftover from
 * an unused Workers/OpenNext deployment path — this site static-exports and
 * deploys via `wrangler pages deploy`). Removing all five pruned 129
 * transitive packages from pnpm-lock.yaml — dead weight isn't just
 * cosmetic, it's slower installs and needless supply-chain surface area
 * the freshness/audit contracts have to keep tracking for no reason.
 *
 * A dependency counts as alive if its name appears (substring match) in any
 * production/build source file, any package.json script value, or any of
 * the well-known config files a build tool consumes without an explicit
 * import. Everything else needs a documented, reasoned
 * KNOWN_INDIRECT_DEPENDENCIES entry — the same allowlist-with-a-reason
 * policy as every other sweep in this repo.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, 'src');
const SCRIPTS = join(ROOT, 'scripts');

/** package name → reason it has no direct textual reference anywhere. */
const KNOWN_INDIRECT_DEPENDENCIES: Record<string, string> = {
  '@types/node': 'ambient type declarations — TypeScript auto-loads from node_modules/@types, never imported by name',
  '@types/react': 'ambient type declarations — TypeScript auto-loads from node_modules/@types, never imported by name',
  '@types/react-dom': 'ambient type declarations — TypeScript auto-loads from node_modules/@types, never imported by name',
  '@vitest/coverage-istanbul': "selected via vitest.config.ts's coverage.provider: 'istanbul' setting, not a literal package-name reference",
  '@vitest/coverage-v8': 'selected via the --coverage.provider=v8 CLI flag in test:coverage:v8, not a literal package-name reference',
  postcss: "required peer of @tailwindcss/postcss's config-loading convention; postcss.config.mjs is postcss's own config format",
  '@stryker-mutator/core': 'required host package of the @stryker-mutator/vitest-runner plugin (referenced by name in stryker.config.mjs); invoked via its own "stryker" CLI binary in test:mutation, never imported by its scoped package name',
};

function listCodeFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'out') continue;
        walk(full);
      } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(dir);
  return files;
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches a real ES/CJS import of `name` or one of its subpaths (e.g.
 *  `eslint-config-next/typescript`) — never a bare substring, so a code
 *  comment or test-assertion string documenting a package by name (e.g.
 *  "beasties regressed mobile CLS") can't masquerade as real usage. */
function isImportedIn(text: string, name: string): boolean {
  const escaped = escapeForRegex(name);
  const importPattern = new RegExp(`from\\s+['"]${escaped}(?:/[^'"]*)?['"]`);
  const requirePattern = new RegExp(`require\\(\\s*['"]${escaped}(?:/[^'"]*)?['"]\\s*\\)`);
  return importPattern.test(text) || requirePattern.test(text);
}

function listRootConfigFiles(): string[] {
  const candidates = [
    'eslint.config.mjs',
    'next.config.mjs',
    'postcss.config.mjs',
    'vitest.config.ts',
    'vitest.setup.ts',
    'tsconfig.json',
    'wrangler.toml',
    'lighthouserc.json',
    'lighthouserc.mobile.json',
    '.markdownlint-cli2.jsonc',
    'stryker.config.mjs',
  ];
  return candidates.map((name) => join(ROOT, name));
}

function listWorkflowFiles(): string[] {
  const dir = join(ROOT, '.github', 'workflows');
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => /\.ya?ml$/.test(entry.name))
      .map((entry) => join(dir, entry.name));
  } catch {
    return [];
  }
}

describe('dead-dependency-contract — every dependency has a real consumer', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  it('every dependency and devDependency is referenced somewhere outside package.json', () => {
    const scriptsText = Object.values(pkg.scripts ?? {}).join('\n');
    const sourceFiles = [...listCodeFiles(SRC), ...listCodeFiles(SCRIPTS)];
    const otherFiles = [...listRootConfigFiles(), ...listWorkflowFiles()];

    // Read every candidate evidence file once — style matches the other
    // repo-wide sweeps (algorithm-and-datastructure-contract etc.).
    const sourceTexts = sourceFiles.map((file) => readFileSync(file, 'utf8'));
    const otherTexts = otherFiles
      .map((file) => {
        try {
          return readFileSync(file, 'utf8');
        } catch {
          return '';
        }
      })
      .filter(Boolean);

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const dead: string[] = [];

    for (const name of Object.keys(allDeps)) {
      if (name in KNOWN_INDIRECT_DEPENDENCIES) continue;

      // Source files require a real import/require statement — a comment or
      // test string mentioning the package name by name doesn't count.
      // Scripts and config files use a plain substring match: npm script
      // values and tool config keys don't carry narrative prose that could
      // produce a false positive the way a code comment can.
      const referenced =
        scriptsText.includes(name) ||
        sourceTexts.some((text) => isImportedIn(text, name)) ||
        otherTexts.some((text) => text.includes(name));

      if (!referenced) dead.push(`  ${name}`);
    }

    expect(
      dead,
      `${dead.length} dependency/dependencies with no reference anywhere outside package.json — ` +
        `remove with "pnpm remove <name>", or add a reasoned KNOWN_INDIRECT_DEPENDENCIES entry if it's ` +
        `genuinely peer-detected by another tool without an explicit reference:\n${dead.join('\n')}`,
    ).toEqual([]);
  });

  it('every KNOWN_INDIRECT_DEPENDENCIES entry names a real dependency and has a real reason', () => {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, reason] of Object.entries(KNOWN_INDIRECT_DEPENDENCIES)) {
      expect(name in allDeps, `KNOWN_INDIRECT_DEPENDENCIES["${name}"] is not even a dependency — delete the entry`).toBe(
        true,
      );
      expect(reason.length, `KNOWN_INDIRECT_DEPENDENCIES["${name}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});
