/**
 * Complexity doctrine contract.
 *
 * The standing order for this codebase, as an executable check: every
 * algorithm, data structure, and pattern is the fastest known — per-event /
 * per-render / per-frame work as close to O(1) as possible, linear work runs
 * exactly once, and no accidental O(n²) ever lands. ENGINEERING-STANDARDS §1
 * states the doctrine; this contract makes it un-commitable to violate.
 *
 * Three halves of the "always fastest, without being asked" guarantee
 * (§6 item 22 — this file is the primary sweep catalog):
 *   1. Repo-wide anti-pattern sweeps (present AND future files) for the
 *      complexity mistakes the other contracts don't already ban: allocation
 *      chains, O(n·m) nested scans, per-render effect re-runs, per-call
 *      regex compilation, and the frame-stepping zero-alloc/no-scan law.
 *      Text sweeps where one shape suffices; real TS AST where it doesn't.
 *   2. The production-dependency ledger: every runtime library's job, why it
 *      beats doing without, and the lighter alternative considered — a new
 *      dependency fails the gate until that's on record.
 *   3. Enforcement wiring: the doctrine is ASSURED BEFORE EVERY COMMIT by a
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
import * as ts from 'typescript';
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

  it('frame-stepping functions allocate nothing — the §2.8 zero-alloc law as a sweep, not a per-engine pin', () => {
    // The 2026-07-23 Math.hypot finding exposed a gap in HOW rules are
    // enforced here: the zero-alloc/optimal-primitive doctrine was pinned
    // per-engine (algorithm contract sections 3, 23, 24), so a NEW frame
    // loop — or an old one a pin never covered — could ship an allocation
    // or slow primitive and nothing would fire until a human read the file.
    // This sweep closes that class: in every *-logic.ts / *-engine.ts
    // module, every exported function named like a frame/event stepper
    // (step*/satisfy*/advance*/integrate*/forEach*/apply*) must contain no
    // allocating or serializing calls. Allocation belongs in create*/build*
    // init functions; steppers mutate persistent state (§2.8).
    const FRAME_FN = /export function ((?:step|satisfy|advance|integrate|forEach|apply)[A-Z]\w*)/g;
    const BANNED = [
      // Allocation / serialization — belongs in create*/build* init functions.
      '.map(', '.filter(', '.concat(', '.slice(', '.reduce(', '.flatMap(',
      'Array.from', 'JSON.', '[...', 'new Array(',
      // Object iteration allocates a keys/values/entries array per call.
      'Object.keys(', 'Object.values(', 'Object.entries(',
      // O(n log n) per frame, and the immutable variants also allocate.
      '.sort(', '.toSorted(', '.toReversed(', '.flat(',
      // String allocation per frame (split/join build new strings/arrays).
      '.split(', '.join(',
      // Per-call linear scans — precompute a Map/Set/index at init instead.
      '.find(', '.findIndex(',
    ];
    const hits: string[] = [];
    for (const file of listProductionSources()) {
      if (!/-(logic|engine)\.ts$/.test(file)) continue;
      const rel = file.replace(`${ROOT}/`, '');
      if (`${rel}::frame-allocation` in ALLOWED_COMPLEXITY_EXCEPTIONS) continue;
      const src = readFileSync(file, 'utf8');
      for (const match of src.matchAll(FRAME_FN)) {
        const bodyEnd = src.indexOf('\nexport ', match.index + 1);
        const body = src
          .slice(match.index, bodyEnd === -1 ? src.length : bodyEnd)
          // Strip comments so prose mentioning a banned call (e.g. "replaces
          // the old concat().slice() double allocation") can't false-positive.
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/[^\n]*/g, '');
        for (const token of BANNED) {
          if (body.includes(token)) hits.push(`  ${rel} → ${match[1]}() contains "${token}"`);
        }
      }
    }
    expect(
      hits,
      `allocation/serialization in frame-stepping function(s) — move it to a create*/build* init function, ` +
        `mutate persistent buffers instead (§2.8), or add a reasoned ALLOWED_COMPLEXITY_EXCEPTIONS ` +
        `"<path>::frame-allocation" entry:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('no .find() inside a .map() callback — that is an O(n·m) nested scan; index with a Map first', () => {
    const nestedScan = /\.map\((?:[^()]|\([^()]*\))*\.find\(/;
    const hits = sweep('nested-scan', (src) => nestedScan.test(src));
    expect(
      hits,
      `nested collection scan(s) — build a Map keyed by the join field once, then .get() in the map callback:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('no .filter(...).length — allocates a throwaway array to compute a count or an existence check', () => {
    const filterLength = /\.filter\((?:[^()]|\([^()]*\))*\)\.length/;
    const hits = sweep('filter-length', (src) => filterLength.test(src));
    expect(
      hits,
      `.filter().length — use .some()/.every() for existence, or a counting loop for a count:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('every React effect/memo hook passes a dependency array — a missing array re-runs on every render (AST)', () => {
    // useEffect(fn) with no second argument re-executes after EVERY render —
    // per-render work that §1 requires to be O(1) becomes "whatever the
    // effect does, every time anything changes". Same for useMemo/useCallback:
    // without deps they recompute every render, which is strictly worse than
    // not using the hook. Regex can't parse nested callbacks reliably, so
    // this walks the real TypeScript AST (same rewrite discipline as §6 item
    // 15 / the naming contract).
    const HOOKS = new Set(['useEffect', 'useLayoutEffect', 'useInsertionEffect', 'useMemo', 'useCallback']);
    const hits: string[] = [];
    for (const file of listProductionSources()) {
      const rel = file.replace(`${ROOT}/`, '');
      if (`${rel}::effect-deps` in ALLOWED_COMPLEXITY_EXCEPTIONS) continue;
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
          const callee = node.expression;
          const name = ts.isIdentifier(callee)
            ? callee.text
            : ts.isPropertyAccessExpression(callee)
              ? callee.name.text
              : '';
          if (HOOKS.has(name) && node.arguments.length < 2) {
            const { line } = source.getLineAndCharacterOfPosition(node.getStart());
            hits.push(`  ${rel}:${line + 1} → ${name}() with no dependency array`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(
      hits,
      `React hook(s) without a dependency array — they re-run on every render; pass deps (or [] for mount-once), ` +
        `or add a reasoned "<path>::effect-deps" exception:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('no RegExp construction inside a function body — compile once at module level (AST)', () => {
    // `new RegExp(...)` inside a function recompiles the pattern on every
    // call. Every current production regex is a module-level constant
    // (dateOrdering's ANCHORED_MONTH_YEAR_RE pattern); this keeps it that
    // way. Dynamic patterns that genuinely depend on runtime input get a
    // reasoned exception.
    const hits: string[] = [];
    for (const file of listProductionSources()) {
      const rel = file.replace(`${ROOT}/`, '');
      if (`${rel}::regex-in-function` in ALLOWED_COMPLEXITY_EXCEPTIONS) continue;
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node, insideFunction: boolean): void => {
        const isRegExpConstruction =
          (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'RegExp';
        if (insideFunction && isRegExpConstruction) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart());
          hits.push(`  ${rel}:${line + 1} → RegExp constructed per call`);
        }
        const entersFunction =
          ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isConstructorDeclaration(node) ||
          ts.isGetAccessorDeclaration(node) ||
          ts.isSetAccessorDeclaration(node);
        ts.forEachChild(node, (child) => visit(child, insideFunction || entersFunction));
      };
      visit(source, false);
    }
    expect(
      hits,
      `per-call RegExp compilation — hoist to a module-level constant, or add a reasoned ` +
        `"<path>::regex-in-function" exception for genuinely dynamic patterns:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('every ALLOWED_COMPLEXITY_EXCEPTIONS entry has a real reason', () => {
    for (const [key, reason] of Object.entries(ALLOWED_COMPLEXITY_EXCEPTIONS)) {
      expect(reason.length, `ALLOWED_COMPLEXITY_EXCEPTIONS["${key}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});

describe('complexity-doctrine-contract — every production library earns its place on record', () => {
  // The "fastest libs" question, made un-skippable: every runtime dependency
  // carries the job it does, why it beats doing without, and what lighter
  // alternative was considered. Adding a dependency without writing that down
  // fails the gate — so the decision happens at add time, in the open, not in
  // a retroactive audit someone has to remember to request. Deleting a dep
  // without removing its entry also fails (self-cleaning, §6 item 18).
  const PRODUCTION_DEPENDENCY_LEDGER: Record<string, string> = {
    'framer-motion':
      'Declarative animation engine behind the §7 engagement doctrine — drag physics, layoutId shared-element ' +
      'transitions, springs. CSS/WAAPI cannot express drag or layoutId; LazyMotion+domMax defers feature eval ' +
      'off the critical path (measured ~20% scriptEvaluation cut). Removal is a §9.4 parked lever (product decision).',
    lenis:
      'Desktop-only smooth scroll (~4KB gz), disabled on coarse pointers (§4.5). Native scroll-behavior was the ' +
      'alternative — it offers no inertia/lerp control, which the desktop feel depends on. Touch devices never load it.',
    next:
      'The framework: App Router static export (output: export), RSC islands (§5), build pipeline. The site IS a ' +
      'Next static export; replacing it is an architecture change, not a dependency swap.',
    react:
      'Component model for the client islands; RSC keeps server sections out of the bundle entirely (§5). ' +
      'Lighter runtimes (preact) were not adopted: React 19 RSC/serialization is load-bearing for the islands architecture.',
    'react-dom':
      'Hydration runtime for the client islands — pairs with react; same rationale, one decision.',
    sharp:
      'Build-time image pipeline: AVIF encoding, icon generation (scripts/generate/). Never ships a byte to a ' +
      'visitor; fastest maintained encoder bindings (libvips) for the §9.2 format ratchet.',
  };

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  const declared = Object.keys(pkg.dependencies ?? {});

  it('every package.json dependency has a ledger entry naming its job and the alternative considered', () => {
    const missing = declared.filter((name) => !(name in PRODUCTION_DEPENDENCY_LEDGER));
    expect(
      missing,
      `production dependenc(y/ies) with no reasoned ledger entry — a runtime lib is a per-visitor cost and ` +
        `earns its place in writing (job, why it beats doing without, lighter alternative considered):\n` +
        missing.map((name) => `  ${name}`).join('\n'),
    ).toEqual([]);
  });

  it('every ledger entry names a dependency that still exists, with a substantive reason', () => {
    for (const [name, reason] of Object.entries(PRODUCTION_DEPENDENCY_LEDGER)) {
      expect(declared.includes(name), `ledger entry "${name}" — dependency removed; delete the entry`).toBe(true);
      expect(reason.length, `ledger entry "${name}" needs a substantive reason (job + alternative)`).toBeGreaterThan(80);
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

  it('pre-commit runs the full validation suite — every contract and test, not a fast subset', () => {
    // Owner mandate (2026-07): ALL contracts and tests must pass before a
    // commit can even be created, not just before push. A partial pre-commit
    // gate (the earlier test:complexity-only version) let a commit land with
    // a broken full suite as long as the fast structural sweeps passed —
    // that gap is closed by running the identical full gate pre-commit runs
    // pre-push: lockfile sync, type-check, zero-warning lint, and the entire
    // vitest suite (which includes test:complexity's files as a strict
    // subset, plus every other contract and unit test).
    const preCommit = pkg['simple-git-hooks']?.['pre-commit'] ?? '';
    expect(preCommit, 'pre-commit must verify the lockfile is in sync').toContain('verify-lockfile-sync');
    expect(preCommit, 'pre-commit must type-check').toContain('type-check');
    expect(preCommit, 'pre-commit must lint with zero warnings').toContain('lint');
    expect(preCommit, 'pre-commit must run the full test suite, not a subset').toMatch(/pnpm test(?!:)/);
  });

  it('pre-push runs everything pre-commit runs, as a strict prefix (redundant safety net)', () => {
    // Pre-push re-verifies the same gate in case a commit was made with
    // --no-verify, or a rebase/cherry-pick introduced drift after the commit
    // hook ran — that part must never diverge. Pre-push then goes further
    // (added 2026-07-23): a production build + artifact-level performance
    // budgets, because every push auto-deploys via Cloudflare Pages (no
    // GitHub Actions CI gate), so the artifact checks must sit on the push
    // itself, not only the manual `deploy:prod` path. A full build is too
    // slow to run on every commit, which is why this lives at push time and
    // not in pre-commit's identical-prefix requirement above.
    const preCommit = pkg['simple-git-hooks']?.['pre-commit'] ?? '';
    const prePush = pkg['simple-git-hooks']?.['pre-push'] ?? '';
    expect(prePush.startsWith(preCommit), 'pre-push must run everything pre-commit runs, unchanged, as a prefix').toBe(
      true,
    );
    expect(prePush, 'pre-push must additionally build and check artifact-level performance budgets').toMatch(
      /pnpm run build && node scripts\/checks\/performance-budgets\.mjs$/,
    );
  });

  it('test:complexity stays a fast, offline, standalone subset for iterative dev use', () => {
    // Not the pre-commit gate itself anymore (see above) — kept as a quick
    // manual command (`pnpm run test:complexity`) a developer can run while
    // iterating without waiting on the full suite or touching the network.
    const script = pkg.scripts?.['test:complexity'] ?? '';
    for (const requiredFile of [
      'src/complexity-doctrine-contract.test.ts',
      'src/components/algorithm-and-datastructure-contract.test.tsx',
      'src/components/animation-regression-contract.test.ts',
      'src/modularization-contract.test.ts',
      'src/dead-logic-export-contract.test.ts',
      'src/dead-dependency-contract.test.ts',
      'src/public-asset-weight-contract.test.ts',
      'src/config-integrity-contract.test.ts',
      'src/docs-quality-contract.test.ts',
      'src/lifecycle-hygiene-contract.test.ts',
      'src/headers-integrity-contract.test.ts',
      'src/test-quality-contract.test.tsx',
      'src/external-links-contract.test.ts',
    ]) {
      expect(script, `test:complexity must include ${requiredFile}`).toContain(requiredFile);
    }
    expect(script).not.toContain('freshness');
  });

  it('the shared pre-commit/pre-push gate runs the full suite', () => {
    const prePush = pkg['simple-git-hooks']?.['pre-push'] ?? '';
    expect(prePush).toContain('pnpm test');
    expect(prePush).toContain('type-check');
    expect(prePush).toContain('lint');
  });
});
