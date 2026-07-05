import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();

const EXPECTED_ROOT_FILES = [
  '.env.example',
  '.gitignore',
  '.nvmrc',
  'CLAUDE.md',
  'ENGINEERING-STANDARDS.md',
  'README.md',
  'eslint.config.mjs',
  'lighthouserc.json',
  'lighthouserc.mobile.json',
  'meoninternet.md',
  'next.config.mjs',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'postcss.config.mjs',
  'tsconfig.json',
  'vercel.json',
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

  it('keeps public/ organized: platform files at root, logos and resumes in their folders', () => {
    // Root of public/ is reserved for files that platforms and crawlers expect
    // at fixed root paths (icons, manifest, service worker, sitemaps, social
    // images). Everything else lives in a purpose-named subdirectory:
    //   public/logos/  — company/institution logos referenced by src/data
    //   public/resume/ — downloadable resume PDFs referenced by src/data/resume.ts
    const EXPECTED_PUBLIC_ROOT_FILES = [
      '_headers',
      '_redirects',
      'apple-touch-icon.png',
      'feed.xml',
      'icon-16x16.png',
      'icon-192x192.png',
      'icon-32x32.png',
      'icon-512x512.png',
      'llms.txt',
      'manifest.json',
      'mcp.json',
      'offline.html',
      'opengraph-image.png',
      'profile-hero-sm.webp',
      'profile-hero.webp',
      'profile.webp',
      'sitemap-images.xml',
      'sw.js',
      'twitter-image.png',
    ] as const;
    const EXPECTED_PUBLIC_DIRS = ['logos', 'resume'] as const;

    const publicPaths = getTrackedFiles()
      .filter((filePath) => filePath.startsWith('public/'))
      .map((filePath) => filePath.slice('public/'.length));

    const rootFiles = publicPaths.filter((p) => !p.includes('/')).sort();
    const dirs = Array.from(new Set(publicPaths.filter((p) => p.includes('/')).map((p) => p.split('/')[0]))).sort();

    expect(rootFiles).toEqual([...EXPECTED_PUBLIC_ROOT_FILES].sort());
    expect(dirs).toEqual([...EXPECTED_PUBLIC_DIRS].sort());

    for (const p of publicPaths) {
      if (p.startsWith('resume/')) {
        expect(p, 'public/resume/ holds only PDF downloads').toMatch(/\.pdf$/);
      }
      if (p.startsWith('logos/')) {
        expect(p, 'public/logos/ holds only image assets').toMatch(/\.(webp|svg|png|avif)$/);
      }
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
