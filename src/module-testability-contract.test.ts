import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const COMPONENTS_ROOT = resolve(PROJECT_ROOT, 'src/components');

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

function isExtractedLogicModule(path: string): boolean {
  const fileName = basename(path);
  return fileName === 'logic.ts' || fileName === 'engine.ts' || fileName === 'builders.ts' || fileName.endsWith('-logic.ts');
}

function hasCompanionTest(modulePath: string): boolean {
  const fileName = basename(modulePath);
  const moduleDir = dirname(modulePath);
  const stem = fileName.replace(/\.ts$/, '');

  const candidates = [
    `${moduleDir}/${stem}.test.ts`,
    `${moduleDir}/${stem}.test.tsx`,
  ];

  if (fileName === 'logic.ts') {
    candidates.push(`${moduleDir}/logic.test.ts`, `${moduleDir}/logic.test.tsx`);
  }

  if (fileName === 'engine.ts') {
    candidates.push(`${moduleDir}/engine.test.ts`, `${moduleDir}/engine.test.tsx`);
  }

  if (fileName === 'builders.ts') {
    candidates.push(`${moduleDir}/builders.test.ts`, `${moduleDir}/builders.test.tsx`);
  }

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

  it('requires extracted visual helper components to keep dedicated tests', () => {
    const requiredPairs: Array<[string, string]> = [
      ['src/components/ui/BrainCursor.tsx', 'src/components/ui/brain-cursor.test.tsx'],
      ['src/components/ui/SectionTransitions.tsx', 'src/components/ui/section-transitions.test.tsx'],
      ['src/components/ui/floating-badge-icon.tsx', 'src/components/ui/floating-badge-icon.test.tsx'],
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
    expect(modularizationScript).toContain('floating-badge-icon.test.tsx');
  });
});
