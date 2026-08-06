import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();

const EXPECTED_ROOT_FILES = [
  '.env.example',
  '.gitignore',
  '.markdownlint-cli2.jsonc',
  '.nvmrc',
  'CLAUDE.md',
  'ENGINEERING-STANDARDS.md',
  'LICENSE',
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
  'stryker.config.mjs',
  'tsconfig.json',
  'vercel.json',
  'vitest.config.stryker.ts',
  'vitest.config.ts',
  'vitest.setup.ts',
  'wrangler.toml',
] as const;

// patches/: pnpm patch's on-disk store for patchedDependencies (currently
// next@16.2.10 — see ENGINEERING-STANDARDS.md §4.7 item 5's
// legacy-javascript-insight fix).
const EXPECTED_ROOT_DIRS = ['.github', 'patches', 'public', 'scripts', 'src'] as const;

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

  it('keeps public/ organized: platform files at root, everything else in a purpose-named folder', () => {
    // Root of public/ is reserved for files that platforms and crawlers expect
    // at fixed root paths by convention or fallback behavior (manifest,
    // service worker, offline page, AI-discovery files, sitemaps, Cloudflare
    // config, apple-touch-icon.png — some iOS versions fetch it from the root
    // regardless of the <link> tag). Everything else lives in a purpose-named
    // subdirectory:
    //   public/logos/  — company/institution logos referenced by src/data
    //   public/resume/ — downloadable resume PDFs referenced by src/data/resume.ts
    //   public/icons/  — favicon-family PNGs referenced by src/app/layout.tsx
    //   public/images/ — profile photo + hero crops referenced by src/data, src/components
    //   public/social/ — OpenGraph/Twitter share card images
    const EXPECTED_PUBLIC_ROOT_FILES = [
      '_headers',
      '_redirects',
      'apple-touch-icon.png',
      'feed.xml',
      'llms.txt',
      'manifest.json',
      'mcp.json',
      'offline.html',
      'sitemap-images.xml',
      'sw.js',
    ] as const;
    const EXPECTED_PUBLIC_DIRS = ['icons', 'images', 'logos', 'resume', 'social'] as const;

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
      if (p.startsWith('logos/') || p.startsWith('images/') || p.startsWith('social/')) {
        expect(p, `public/${p.split('/')[0]}/ holds only image assets`).toMatch(/\.(webp|svg|png|avif)$/);
      }
      if (p.startsWith('icons/')) {
        expect(p, 'public/icons/ holds only PNG icons').toMatch(/\.png$/);
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
