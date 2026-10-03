/**
 * Is a GitHub repository visible to a visitor? Shared by the refresh script
 * (check-repo-visibility.mjs) and the networked half of
 * src/repo-visibility-contract.test.ts.
 *
 * The status code alone is the wrong instrument: called with the owner's
 * token, GitHub answers 200 for a PRIVATE repository too. So a 200 is
 * classified by its `private` field, and a 404 (what an anonymous visitor
 * gets for a private or missing repository) is 'private' — either way there
 * is nothing a visitor could open. Anything else is an error, never a guess.
 */

import { spawnSync } from 'node:child_process';

/**
 * GITHUB_TOKEN / GH_TOKEN, else the logged-in `gh` CLI's token, else none.
 * Anonymous calls get 60 requests an hour, which a busy commit session spends.
 * Using the owner's token is safe only because classifyRepoResponse reads
 * the `private` field rather than trusting a 200.
 */
export function resolveGitHubToken(env = process.env, spawn = spawnSync) {
  const fromEnv = env.GITHUB_TOKEN ?? env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  const result = spawn('gh', ['auth', 'token'], { encoding: 'utf8' });
  const token = result.status === 0 ? result.stdout.trim() : '';
  return token || undefined;
}

/** @returns {'public' | 'private'} */
export function classifyRepoResponse(status, body) {
  if (status === 200) return body && body.private === false ? 'public' : 'private';
  if (status === 404) return 'private';
  throw new Error(`unexpected GitHub API status ${status}`);
}

export async function fetchRepoVisibility(repository, { token, fetchImpl = fetch } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'cameronaaron.com-repo-visibility' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(`https://api.github.com/repos/${repository}`, { headers });
  if (response.status === 403 || response.status === 429) {
    throw new Error(
      `GitHub rate-limited the visibility check for ${repository} (${response.status}); set GITHUB_TOKEN and re-run`
    );
  }
  const body = response.status === 200 ? await response.json() : null;
  return classifyRepoResponse(response.status, body);
}

/** Every `repositoryFields('owner/name')` call in src/data/projects.ts. */
export function extractRepositories(projectsSource) {
  const repositories = [];
  for (const match of projectsSource.matchAll(/repositoryFields\('([\w.-]+\/[\w.-]+)'\)/g)) {
    repositories.push(match[1]);
  }
  return repositories;
}
