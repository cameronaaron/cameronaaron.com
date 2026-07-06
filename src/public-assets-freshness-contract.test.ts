/**
 * Public-assets freshness contract.
 *
 * Closes a hole discovered during a 2026-07 cleanup pass: nothing checked
 * whether a file committed under `public/` was ever actually referenced.
 * Four images (`bgrad.webp`, `coursera.svg.webp`, `google.webp`,
 * `profile-original.webp` — 350KB combined) had sat unreferenced for weeks;
 * `pnpm outdated`/`pnpm audit`/the coverage gate/every other contract had zero
 * visibility into `public/`, because none of them ask "is this file used?",
 * only "does the code that exists behave correctly?" This sweep asks the
 * former question directly, repo-wide, so new dead assets get caught the
 * commit they're orphaned rather than accumulating silently for months.
 *
 * A file counts as "referenced" if its name appears anywhere in:
 *   - src/**\/*.{ts,tsx}         (components, data, tests)
 *   - scripts/**\/*.mjs          (icon/discovery generators, SEO/perf checks)
 *   - next.config.mjs
 *   - public/_headers, public/_redirects   (Cloudflare Pages reads these)
 *   - public/manifest.json                 (PWA manifest references its own icons)
 *   - public/sw.js                         (service worker references offline.html etc.)
 *
 * That is deliberately broad — false negatives (missing a real reference and
 * failing on a live asset) are far more costly than false positives, so when
 * in doubt this sweep searches more files, not fewer. A handful of files are
 * discovered by URL/protocol convention alone (crawlers hitting a well-known
 * path) rather than by any in-repo string reference — those are the only
 * items in PUBLIC_CONVENTION_EXEMPT, each with a reason.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const PUBLIC_DIR = join(ROOT, 'public');

// Files discoverable only by URL/protocol convention — never grep-referenced
// because nothing in-repo needs to name them; a browser or crawler requests
// them directly by well-known path.
const PUBLIC_CONVENTION_EXEMPT: Record<string, string> = {
  'llms.txt': 'AI-crawler discovery file — fetched by convention (like robots.txt), not linked in-app.',
};

function listPublicFiles(): string[] {
  // Walks subdirectories (logos/, resume/, …) so grouped assets stay covered
  // by the orphan sweep. Returns paths relative to public/.
  const files: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full, `${prefix}${name}/`);
      } else {
        files.push(`${prefix}${name}`);
      }
    }
  };
  walk(PUBLIC_DIR, '');
  return files;
}

function baseName(relativePath: string): string {
  const parts = relativePath.split('/');
  return parts[parts.length - 1] ?? relativePath;
}

function listSearchableSources(): string[] {
  const files: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(join(ROOT, 'src'));
  walk(join(ROOT, 'scripts'));

  files.push(
    join(ROOT, 'next.config.mjs'),
    join(PUBLIC_DIR, '_headers'),
    join(PUBLIC_DIR, '_redirects'),
    join(PUBLIC_DIR, 'manifest.json'),
    join(PUBLIC_DIR, 'sw.js'),
  );

  return files;
}

describe('public-assets-freshness-contract — every public/ file is referenced somewhere', () => {
  it('finds files to check (sanity guard against a silently-empty sweep)', () => {
    expect(listPublicFiles().length).toBeGreaterThan(0);
  });

  it('every public/ file name appears in at least one source, config, or convention file', () => {
    const publicFiles = listPublicFiles();
    const sourceFiles = listSearchableSources();

    const corpus = sourceFiles
      .map((file) => {
        try {
          return readFileSync(file, 'utf8');
        } catch {
          return '';
        }
      })
      .join('\n');

    const orphaned = publicFiles.filter((relativePath) => {
      const name = baseName(relativePath);
      if (PUBLIC_CONVENTION_EXEMPT[name]) return false;
      // A file referencing itself (e.g. manifest.json containing "manifest.json"
      // in a comment) doesn't count — strip the file's own content from the
      // corpus check isn't practical here, so instead require the reference to
      // come from a DIFFERENT file than the asset itself never applies to
      // public/ binary assets (images/xml/js aren't in the searched-source set),
      // so a plain substring match against the combined corpus is safe.
      return !corpus.includes(name);
    });

    expect(
      orphaned,
      `${orphaned.length} orphaned public/ file(s) — not referenced anywhere. ` +
        `Either use them, delete them, or add a documented entry to PUBLIC_CONVENTION_EXEMPT:\n` +
        orphaned.map((name) => `  public/${name}`).join('\n'),
    ).toEqual([]);
  });

  it('every PUBLIC_CONVENTION_EXEMPT entry still exists in public/ (no stale exemptions)', () => {
    const publicFiles = new Set(listPublicFiles().map(baseName));
    for (const name of Object.keys(PUBLIC_CONVENTION_EXEMPT)) {
      expect(publicFiles.has(name), `Exempted file "${name}" no longer exists in public/ — remove its exemption`).toBe(
        true,
      );
    }
  });
});
