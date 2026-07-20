import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const COMPONENTS_ROOT = resolve(PROJECT_ROOT, 'src/components');
const APP_ROOT = resolve(PROJECT_ROOT, 'src/app');
const HOOKS_ROOT = resolve(PROJECT_ROOT, 'src/hooks');

function walkFiles(path: string): string[] {
  const entries = readdirSync(path, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = resolve(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function toWorkspacePath(absolutePath: string): string {
  return relative(PROJECT_ROOT, absolutePath).replace(/\\/g, '/');
}

// ENGINEERING-STANDARDS §8.1 requires the qualified, directory-prefixed form
// repo-wide (2026-07) — a bare `logic.ts`/`engine.ts`/`builders.ts` is
// ambiguous the moment it's seen outside its own directory (a search result,
// an open editor tab, a stack trace). `src/components/projects/` alone once
// held a bare `logic.ts` beside `card-logic.ts` and `featured-logic.ts` — the
// exact confusion this convention exists to rule out.
function isExtractedLogicModule(path: string): boolean {
  const fileName = basename(path);
  return /-logic\.ts$|-engine\.ts$|-builders\.ts$/.test(fileName);
}

function hasCompanionTest(modulePath: string): boolean {
  const fileName = basename(modulePath);
  const moduleDir = dirname(modulePath);
  const stem = fileName.replace(/\.ts$/, '');

  const candidates = [
    `${moduleDir}/${stem}.test.ts`,
    `${moduleDir}/${stem}.test.tsx`,
  ];

  return candidates.some((candidate) => existsSync(resolve(PROJECT_ROOT, candidate)));
}

describe('module testability contract', () => {
  it('requires every extracted helper module to have a co-located companion test', () => {
    const allComponentFiles = walkFiles(COMPONENTS_ROOT).map(toWorkspacePath);
    const helperModules = allComponentFiles.filter(isExtractedLogicModule);

    const missingCompanionTests = helperModules.filter((modulePath) => !hasCompanionTest(modulePath));

    expect(helperModules.length).toBeGreaterThan(0);
    expect(missingCompanionTests).toEqual([]);
  });

  it('requires app-route logic modules to have co-located companion tests too', () => {
    const allAppFiles = walkFiles(APP_ROOT).map(toWorkspacePath);
    const helperModules = allAppFiles.filter(isExtractedLogicModule);

    const missingCompanionTests = helperModules.filter((modulePath) => !hasCompanionTest(modulePath));

    expect(helperModules.length).toBeGreaterThan(0);
    expect(missingCompanionTests).toEqual([]);
  });

  it('requires every hook to be exercised by a test under src/hooks', () => {
    const hookFiles = walkFiles(HOOKS_ROOT)
      .map(toWorkspacePath)
      .filter((path) => /\/use[A-Z]\w*\.ts$/.test(path));
    const hookTests = walkFiles(HOOKS_ROOT)
      .map(toWorkspacePath)
      .filter((path) => /\.test\.tsx?$/.test(path))
      .map((path) => readFileSync(resolve(PROJECT_ROOT, path), 'utf8'))
      .join('\n');

    expect(hookFiles.length).toBeGreaterThan(0);
    for (const hookFile of hookFiles) {
      const hookName = basename(hookFile).replace(/\.ts$/, '');
      expect(hookTests, `${hookFile} has no direct test in src/hooks`).toContain(hookName);
    }
  });

  it('requires extracted visual helper components to keep dedicated tests', () => {
    const requiredPairs: Array<[string, string]> = [
      ['src/components/ui/SectionTransitions.tsx', 'src/components/ui/section-transitions.test.tsx'],
      ['src/components/ui/FloatingBadgeIcon.tsx', 'src/components/ui/FloatingBadgeIcon.test.tsx'],
      ['src/components/projects/FeaturedIcon.tsx', 'src/components/projects/FeaturedIcon.test.tsx'],
      ['src/components/contact/SocialPlatformIcon.tsx', 'src/components/contact/SocialPlatformIcon.test.tsx'],
    ];

    for (const [modulePath, testPath] of requiredPairs) {
      expect(existsSync(resolve(PROJECT_ROOT, modulePath))).toBe(true);
      expect(existsSync(resolve(PROJECT_ROOT, testPath))).toBe(true);
    }
  });

  it('requires the modularization npm script to include contract and module-testability guard tests', () => {
    const packageJson = JSON.parse(readFileSync(resolve(PROJECT_ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };

    const modularizationScript = packageJson.scripts?.['test:modularization'] ?? '';

    expect(modularizationScript).toContain('src/modularization-contract.test.ts');
    expect(modularizationScript).toContain('src/module-testability-contract.test.ts');
    expect(modularizationScript).toContain('FloatingBadgeIcon.test.tsx');

    const repoHygieneScript = packageJson.scripts?.['test:repo:hygiene'] ?? '';
    expect(repoHygieneScript).toContain('src/repo-hygiene-contract.test.ts');
  });
});
