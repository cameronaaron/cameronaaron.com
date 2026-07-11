/**
 * Complexity doctrine contract.
 *
 * The standing order for this codebase, as an executable check: every
 * algorithm, data structure, and pattern is the fastest known — per-event /
 * per-render / per-frame work as close to O(1) as possible, linear work runs
 * exactly once, and no accidental O(n²) ever lands. ENGINEERING-STANDARDS §1
 * states the doctrine; this contract makes it un-commitable to violate.
 *
 * Two halves:
 *   1. Repo-wide anti-pattern sweeps (present AND future files) for the
 *      complexity mistakes the other contracts don't already ban.
 *   2. Enforcement wiring: the doctrine is ASSURED BEFORE EVERY COMMIT by a
 *      simple-git-hooks pre-commit hook running `pnpm run test:complexity`
 *      (every structural sweep, offline and fast). This contract asserts the
 *      hook and the script exist and cover the right files — the gate cannot
 *      be silently unwired without this test failing on the next run.
 *
 * Deliberate exceptions go in ALLOWED_COMPLEXITY_EXCEPTIONS with a reason —
 * a decision on record, not a loophole.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, 'src');

/** "relative/path.ts::rule" → reason */
const ALLOWED_COMPLEXITY_EXCEPTIONS: Record<string, string> = {};

function listProductionSources(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) files.push(full);
    }
  };
  walk(SRC);
  return files;
}

function sweep(rule: string, offenders: (src: string) => boolean): string[] {
  const hits: string[] = [];
  for (const file of listProductionSources()) {
    const rel = file.replace(`${ROOT}/`, '');
    if (`${rel}::${rule}` in ALLOWED_COMPLEXITY_EXCEPTIONS) continue;
    if (offenders(readFileSync(file, 'utf8'))) hits.push(`  ${rel}`);
  }
  return hits;
}

describe('complexity-doctrine-contract — repo-wide anti-pattern sweeps', () => {
  it('no filter().map() chains — single-pass loop instead of an intermediate array', () => {
    // Mirror of the existing map().filter() ban: .filter(...).map(...) walks
    // the collection twice and allocates a throwaway intermediate.
    const filterThenMap = /\.filter\(((?:[^()]|\([^()]*\))*)\)\s*\n?\s*\.map\(/;
    const hits = sweep('filter-then-map', (src) => filterThenMap.test(src));
    expect(hits, `filter().map() chain(s) — use one pass with conditional push:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no spread accumulator inside reduce() — that is O(n²) allocation', () => {
    const spreadReduce = /\.reduce\(((?:[^()]|\([^()]*\))*)\.\.\./;
    const hits = sweep('spread-reduce', (src) => spreadReduce.test(src));
    expect(hits, `spread-accumulator reduce (O(n²)) — build with a mutable accumulator:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no JSON.parse(JSON.stringify()) deep clones — O(n) serialization round-trip', () => {
    const hits = sweep('json-clone', (src) => src.includes('JSON.parse(JSON.stringify'));
    expect(hits, `JSON round-trip clone(s) — use structuredClone or targeted copies:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no Array.prototype.unshift — every call shifts the whole array (O(n))', () => {
    const hits = sweep('unshift', (src) => src.includes('.unshift('));
    expect(hits, `unshift call(s) — push then reverse once, or write-index into a preallocated array:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no `delete obj.prop` statements — hidden-class deopt; assign undefined or use a Map', () => {
    const deleteStatement = /^\s*delete\s+[A-Za-z_$][\w$]*[.[]/m;
    const hits = sweep('delete-operator', (src) => deleteStatement.test(src));
    expect(hits, `delete-operator statement(s):\n${hits.join('\n')}`).toEqual([]);
  });

  it('every ALLOWED_COMPLEXITY_EXCEPTIONS entry has a real reason', () => {
    for (const [key, reason] of Object.entries(ALLOWED_COMPLEXITY_EXCEPTIONS)) {
      expect(reason.length, `ALLOWED_COMPLEXITY_EXCEPTIONS["${key}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});

describe('complexity-doctrine-contract — the doctrine stays written down', () => {
  it('ENGINEERING-STANDARDS keeps the complexity doctrine and the zero-alloc frame-loop law', () => {
    const standards = readFileSync(join(ROOT, 'ENGINEERING-STANDARDS.md'), 'utf8');
    expect(standards).toContain('## 1. The complexity doctrine');
    expect(standards).toContain('### 2.8 Zero-allocation frame loops');
  });
});

describe('complexity-doctrine-contract — assured before every commit', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
    'simple-git-hooks'?: Record<string, string>;
  };

  it('a pre-commit hook runs the complexity gate', () => {
    const preCommit = pkg['simple-git-hooks']?.['pre-commit'] ?? '';
    expect(
      preCommit,
      'package.json simple-git-hooks.pre-commit must run "pnpm run test:complexity" — the doctrine is assured before every commit',
    ).toContain('test:complexity');
  });

  it('test:complexity covers every structural sweep, offline and fast', () => {
    const script = pkg.scripts?.['test:complexity'] ?? '';
    for (const requiredFile of [
      'src/complexity-doctrine-contract.test.ts',
      'src/components/algorithm-and-datastructure-contract.test.tsx',
      'src/components/animation-regression-contract.test.ts',
      'src/modularization-contract.test.ts',
      'src/dead-logic-export-contract.test.ts',
      'src/public-asset-weight-contract.test.ts',
      'src/config-integrity-contract.test.ts',
      'src/docs-quality-contract.test.ts',
      'src/lifecycle-hygiene-contract.test.ts',
      'src/headers-integrity-contract.test.ts',
    ]) {
      expect(script, `test:complexity must include ${requiredFile}`).toContain(requiredFile);
    }
    // Pre-commit must stay offline: the networked freshness contracts belong
    // to pre-push/CI, not here.
    expect(script).not.toContain('freshness');
  });

  it('the pre-push gate still runs the full suite (heavy half of the two-stage gate)', () => {
    const prePush = pkg['simple-git-hooks']?.['pre-push'] ?? '';
    expect(prePush).toContain('pnpm test');
    expect(prePush).toContain('type-check');
    expect(prePush).toContain('lint');
  });
});
