#!/usr/bin/env node
/**
 * Refreshes scripts/checks/repo-visibility-ledger.json: one entry per
 * GitHub repository named in src/data/projects.ts, recording whether a
 * visitor can see it. src/data/repoVisibility.ts reads the ledger at build
 * time, so the day a repository goes public, running this script (and
 * committing the ledger) is all it takes for its card to link to it.
 *
 * src/repo-visibility-contract.test.ts re-asks GitHub on every commit and
 * fails when the ledger no longer matches, pointing here.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { extractRepositories, fetchRepoVisibility, resolveGitHubToken } from './repo-visibility.mjs';

const ROOT = resolve(import.meta.dirname, '..', '..');
const LEDGER_PATH = join(import.meta.dirname, 'repo-visibility-ledger.json');

const repositories = extractRepositories(readFileSync(join(ROOT, 'src', 'data', 'projects.ts'), 'utf8'));
const token = resolveGitHubToken();
const now = new Date().toISOString();
const ledger = {};

for (const repository of [...repositories].sort()) {
  const visibility = await fetchRepoVisibility(repository, { token });
  ledger[repository] = { visibility, lastChecked: now };
  console.log(`  ${visibility.padEnd(8)} ${repository}`);
}

writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`Ledger written to ${LEDGER_PATH.replace(`${ROOT}/`, '')}.`);
