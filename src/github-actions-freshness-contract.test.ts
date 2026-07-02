/**
 * GitHub Actions freshness contract.
 *
 * `dependency-freshness-contract.test.ts` covers the npm/pnpm dependency
 * tree — it has never had visibility into `.github/workflows/*.yml`, because
 * `uses: owner/repo@vX` pins are a completely separate ecosystem (GitHub
 * releases, not the npm registry). That blind spot let actions/checkout,
 * actions/setup-node, and pnpm/action-setup drift 2-3 majors behind while
 * `pnpm outdated` stayed green the whole time — surfacing only as a
 * "Node.js 20 is deprecated" annotation on every CI run. This contract closes
 * that hole: every `uses:` pin across every workflow file must be at its
 * latest published major version.
 *
 * SHA-pinned actions (40-hex-char ref) are treated as a deliberate supply-chain
 * choice and skipped — they're already maximally pinned, "freshness" doesn't
 * apply the same way, and bumping them is a manual security-review decision.
 *
 * To fix: bump the `@vN` suffix in the workflow file(s) named in the failure
 * message to the printed latest major, then rerun this test.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const WORKFLOWS_DIR = join(ROOT, '.github', 'workflows');

interface ActionPin {
  ownerRepo: string;
  ref: string;
  file: string;
  line: number;
}

function listWorkflowFiles(): string[] {
  return readdirSync(WORKFLOWS_DIR)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => join(WORKFLOWS_DIR, name));
}

const USES_LINE_RE = /^\s*(?:-\s*)?uses:\s*([\w.-]+\/[\w.-]+)@([\w.-]+)\s*$/;
const SHA_PIN_RE = /^[0-9a-f]{40}$/i;

function collectActionPins(): ActionPin[] {
  const pins: ActionPin[] = [];
  for (const file of listWorkflowFiles()) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      const match = USES_LINE_RE.exec(line);
      if (!match) return;
      pins.push({ ownerRepo: match[1], ref: match[2], file, line: index + 1 });
    });
  }
  return pins;
}

function majorOf(tag: string): number | null {
  const match = /^v?(\d+)/.exec(tag);
  return match ? Number(match[1]) : null;
}

async function fetchLatestTag(ownerRepo: string): Promise<string> {
  const headers: Record<string, string> = { 'User-Agent': 'freshness-contract-test' };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const releaseRes = await fetch(`https://api.github.com/repos/${ownerRepo}/releases/latest`, { headers });
  if (releaseRes.ok) {
    const data = (await releaseRes.json()) as { tag_name?: string };
    if (data.tag_name) return data.tag_name;
  }

  // Some actions (no GitHub Releases published) only have tags.
  const tagsRes = await fetch(`https://api.github.com/repos/${ownerRepo}/tags?per_page=30`, { headers });
  if (!tagsRes.ok) {
    throw new Error(`GitHub API request failed for ${ownerRepo}: ${tagsRes.status} ${releaseRes.status}`);
  }
  const tags = (await tagsRes.json()) as Array<{ name: string }>;
  const best = tags
    .map((t) => ({ name: t.name, major: majorOf(t.name) }))
    .filter((t): t is { name: string; major: number } => t.major !== null)
    .sort((a, b) => b.major - a.major)[0];
  if (!best) throw new Error(`No semver-like tags found for ${ownerRepo}`);
  return best.name;
}

describe('github-actions-freshness-contract — every workflow action pin is current', () => {
  it('finds at least one uses: pin to check (sanity guard against a silently-empty sweep)', () => {
    expect(collectActionPins().length).toBeGreaterThan(0);
  });

  it('every non-SHA-pinned action is at its latest published major version', async () => {
    const pins = collectActionPins();
    const floatingPins = pins.filter((p) => !SHA_PIN_RE.test(p.ref));

    const uniqueActions = Array.from(new Set(floatingPins.map((p) => p.ownerRepo)));

    const latestByAction = new Map<string, string>();
    for (const ownerRepo of uniqueActions) {
      latestByAction.set(ownerRepo, await fetchLatestTag(ownerRepo));
    }

    const stale: string[] = [];
    for (const pin of floatingPins) {
      const latestTag = latestByAction.get(pin.ownerRepo);
      if (!latestTag) continue;

      const pinnedMajor = majorOf(pin.ref);
      const latestMajor = majorOf(latestTag);
      if (pinnedMajor === null || latestMajor === null) continue;

      if (pinnedMajor < latestMajor) {
        stale.push(
          `  ${pin.file.replace(`${ROOT}/`, '')}:${pin.line} — ${pin.ownerRepo}@${pin.ref} → latest is ${latestTag}`,
        );
      }
    }

    expect(
      stale,
      `${stale.length} stale GitHub Action pin(s) — bump the @vN suffix to the latest major shown:\n${stale.join('\n')}`,
    ).toHaveLength(0);
  }, 30_000);
});
