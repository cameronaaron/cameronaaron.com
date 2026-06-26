import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();

const EXPECTED_ROOT_FILES = [
  '.env.example',
  '.gitignore',
  'CLAUDE.md',
  'README.md',
  'eslint.config.mjs',
  'lighthouserc.json',
  'meoninternet.md',
  'next.config.mjs',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'postcss.config.mjs',
  'tsconfig.json',
  'vercel.json',
  'verify-deployment.sh',
  'vitest.config.ts',
  'vitest.setup.ts',
  'wrangler.toml',
] as const;

const EXPECTED_ROOT_DIRS = ['.github', 'public', 'scripts', 'src'] as const;

function getTrackedFiles(): string[] {
  const output = execFileSync('git', ['ls-files'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
  }).trim();

  return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function getBaseName(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] ?? filePath;
}

describe('repository hygiene contract', () => {
  it('keeps root filenames and directories intentionally minimal and explicit', () => {
    const files = getTrackedFiles();

    const rootFiles = files.filter((filePath) => !filePath.includes('/')).sort();
    const rootDirs = Array.from(new Set(files.filter((filePath) => filePath.includes('/')).map((filePath) => filePath.split('/')[0]))).sort();

    expect(rootFiles).toEqual([...EXPECTED_ROOT_FILES].sort());
    expect(rootDirs).toEqual([...EXPECTED_ROOT_DIRS].sort());
  });

  it('forbids whitespace and duplicate separators in tracked paths', () => {
    const files = getTrackedFiles();

    for (const filePath of files) {
      expect(filePath).not.toMatch(/\s/);
      expect(filePath).not.toContain('//');
    }
  });

  it('keeps public asset filenames lowercase except Cloudflare special files', () => {
    const files = getTrackedFiles();

    const publicFiles = files.filter((filePath) => filePath.startsWith('public/')).map(getBaseName);

    for (const fileName of publicFiles) {
      if (fileName === '_headers' || fileName === '_redirects') {
        continue;
      }

      expect(fileName).toBe(fileName.toLowerCase());
    }
  });

  it('keeps src/data source and test filename conventions consistent', () => {
    const files = getTrackedFiles();

    const dataFiles = files.filter((filePath) => filePath.startsWith('src/data/')).map(getBaseName);

    for (const fileName of dataFiles) {
      if (fileName.endsWith('.test.ts')) {
        expect(fileName).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*\.test\.ts$/);
        continue;
      }

      expect(fileName).toMatch(/^[a-z][a-zA-Z0-9]*\.ts$/);
    }
  });

  it('keeps src/hooks source and test filename conventions consistent', () => {
    const files = getTrackedFiles();

    const hookFiles = files.filter((filePath) => filePath.startsWith('src/hooks/')).map(getBaseName);

    for (const fileName of hookFiles) {
      if (fileName.endsWith('.test.ts') || fileName.endsWith('.test.tsx')) {
        expect(fileName).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*\.test\.tsx?$/);
        continue;
      }

      expect(fileName).toMatch(/^use[A-Za-z0-9]+\.tsx?$/);
    }
  });
});
