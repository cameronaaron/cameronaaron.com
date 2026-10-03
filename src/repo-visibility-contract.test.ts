/**
 * Repository visibility contract.
 *
 * Five of the projects added 2026-10 live in private GitHub repositories. A
 * card must not link a visitor to a 404, and it must not keep hiding a link
 * once a repository goes public. So no project hard-codes a GitHub link:
 * `repositoryFields()` (src/data/repoVisibility.ts) derives link and call to
 * action from scripts/checks/repo-visibility-ledger.json.
 *
 * This file checks that the ledger is complete and drives the data
 * (offline), and then asks GitHub whether each repository is still what the
 * ledger says (networked, same posture as the dependency-freshness
 * contract). When a repository changes visibility, the networked test fails
 * with the fix: run `pnpm run check:repos` and commit the ledger, and the
 * card links (or stops linking) on the next build.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { projects } from '@/data/projects';
import {
  PRIVATE_REPOSITORY_CTA,
  PUBLIC_REPOSITORY_CTA,
  REPO_VISIBILITY,
  repositoryFields,
} from '@/data/repoVisibility';
import {
  classifyRepoResponse,
  extractRepositories,
  fetchRepoVisibility,
  resolveGitHubToken,
} from '../scripts/checks/repo-visibility.mjs';

const ROOT = resolve(process.cwd());
const PROJECTS_SOURCE = readFileSync(join(ROOT, 'src', 'data', 'projects.ts'), 'utf8');
const MAX_LEDGER_AGE_DAYS = 45;

describe('repo-visibility — classifying what a visitor can see', () => {
  it('a 200 for a public repository is public', () => {
    expect(classifyRepoResponse(200, { private: false })).toBe('public');
  });

  it("a 200 for a private repository is private — the owner's token sees it, a visitor does not", () => {
    expect(classifyRepoResponse(200, { private: true })).toBe('private');
    expect(classifyRepoResponse(200, {})).toBe('private');
    expect(classifyRepoResponse(200, null)).toBe('private');
  });

  it("a 404 (what an anonymous visitor gets for a private repository) is private", () => {
    expect(classifyRepoResponse(404, null)).toBe('private');
  });

  it('any other status is an error, never a guess', () => {
    expect(() => classifyRepoResponse(500, null)).toThrow('unexpected GitHub API status 500');
  });

  it('a rate-limited check fails loudly instead of reporting private', async () => {
    const fetchImpl = async () => new Response('', { status: 403 });
    await expect(fetchRepoVisibility('cameronaaron/x', { fetchImpl })).rejects.toThrow(/rate-limited.*GITHUB_TOKEN/);
  });

  it('sends the token when given one and reads the private flag', async () => {
    let seenAuth: string | null = null;
    const fetchImpl = async (_url: string, init: { headers: Record<string, string> }) => {
      seenAuth = init.headers.Authorization ?? null;
      return new Response(JSON.stringify({ private: true }), { status: 200 });
    };
    await expect(fetchRepoVisibility('cameronaaron/x', { token: 't', fetchImpl })).resolves.toBe('private');
    expect(seenAuth).toBe('Bearer t');
  });
});

describe('repo-visibility — token resolution', () => {
  const failingGh = () => ({ status: 1, stdout: '' });
  it('prefers GITHUB_TOKEN, then GH_TOKEN, then the gh CLI', () => {
    expect(resolveGitHubToken({ GITHUB_TOKEN: 'a', GH_TOKEN: 'b' }, failingGh)).toBe('a');
    expect(resolveGitHubToken({ GH_TOKEN: 'b' }, failingGh)).toBe('b');
    expect(resolveGitHubToken({}, () => ({ status: 0, stdout: 'c\n' }))).toBe('c');
  });

  it('falls back to anonymous when gh is missing or logged out', () => {
    expect(resolveGitHubToken({}, failingGh)).toBeUndefined();
    expect(resolveGitHubToken({}, () => ({ status: 0, stdout: '  ' }))).toBeUndefined();
  });
});

describe('repo-visibility — the ledger drives the data', () => {
  const repositories = extractRepositories(PROJECTS_SOURCE);

  it('finds every repository-backed project in projects.ts', () => {
    expect(repositories).toHaveLength(projects.filter((p) => p.repository !== undefined).length);
    expect(repositories.length).toBeGreaterThan(0);
  });

  it('no project hard-codes a GitHub repository link', () => {
    expect(PROJECTS_SOURCE).not.toMatch(/link:\s*["']https:\/\/github\.com\//);
  });

  it('the ledger has exactly one entry per repository, and no orphans', () => {
    expect(Object.keys(REPO_VISIBILITY).sort()).toEqual([...repositories].sort());
  });

  it(`every ledger entry was verified within the last ${MAX_LEDGER_AGE_DAYS} days`, () => {
    const stale = Object.entries(REPO_VISIBILITY)
      .filter(([, entry]) => (Date.now() - new Date(entry.lastChecked).getTime()) / 86_400_000 > MAX_LEDGER_AGE_DAYS)
      .map(([repository]) => repository);
    expect(stale, 'run "pnpm run check:repos"').toEqual([]);
  });

  it('a public repository links to GitHub and a private one does not link at all', () => {
    for (const project of projects) {
      if (project.repository === undefined) continue;
      const visibility = REPO_VISIBILITY[project.repository].visibility;
      if (visibility === 'public') {
        expect(project.link).toBe(`https://github.com/${project.repository}`);
        expect(project.cta).toBe(PUBLIC_REPOSITORY_CTA);
      } else {
        expect(project.link).toBeUndefined();
        expect(project.cta).toBe(PRIVATE_REPOSITORY_CTA);
      }
    }
  });

  it('an unknown repository is treated as private', () => {
    expect(repositoryFields('cameronaaron/not-in-ledger')).toEqual({
      repository: 'cameronaaron/not-in-ledger',
      cta: PRIVATE_REPOSITORY_CTA,
    });
  });
});

describe('repo-visibility — the ledger still matches GitHub (networked)', () => {
  const token = resolveGitHubToken();

  for (const repository of extractRepositories(PROJECTS_SOURCE)) {
    it(`${repository} is still ${REPO_VISIBILITY[repository]?.visibility ?? 'in the ledger'}`, async () => {
      const actual = await fetchRepoVisibility(repository, { token });
      expect(
        actual,
        `${repository} is now ${actual} — run "pnpm run check:repos" and commit the ledger so its card ` +
          (actual === 'public' ? 'links to it' : 'stops linking to a 404')
      ).toBe(REPO_VISIBILITY[repository]?.visibility);
    }, 30_000);
  }
});
