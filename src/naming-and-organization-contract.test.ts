/**
 * Naming and organization contract (ENGINEERING-STANDARDS.md §8).
 *
 * Two independent sweeps, both real-parser-based per the rewrite discipline in
 * §6 item 15 (a regex denylist evades exactly the way that item documents —
 * `const dat_a` or a destructured re-export would slip past a naive string
 * match):
 *
 *   1. Filename casing, keyed to each directory's already-established role
 *      (§8.1): PascalCase components, `use*` hooks, kebab-case logic modules,
 *      camelCase data files, Next.js/Cloudflare reserved entry points left
 *      alone. `repo-hygiene-contract.test.ts` already checks this for
 *      `src/data/` and `src/hooks/` alone; this generalizes the identical
 *      shape to every directory under `src/`.
 *   2. Lazy exported identifiers (§8.2): every exported `const`/`function`/
 *      `class` name in `src/` is walked with the real TypeScript compiler and
 *      checked against a documented denylist of names that describe nothing
 *      (`data`, `temp`, `thing`, `helper`, `util`, …).
 *
 * A 2026-07 audit before writing this file found the codebase already clean
 * except one real mismatch — `floating-badge-icon.tsx` exported
 * `FloatingBadgeIcon` under a kebab-case filename — fixed in the same commit
 * that added this contract (renamed to `FloatingBadgeIcon.tsx`, every import
 * site updated). This is therefore a forward guard, same posture as §6 item
 * 19's doc cross-reference contract: it locks in an already-true state, not a
 * cleanup of an existing mess.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'src');

/** "path/to/file.ext" → reason. A documented exception, not a loophole
 * (§6 item 18's bar: a concrete, checkable fact, not "it's hard"). */
const ALLOWED_FILENAME_EXCEPTIONS: Record<string, string> = {};

/** "path/to/file.ext::identifierName" → reason. */
const ALLOWED_LAZY_IDENTIFIER_EXCEPTIONS: Record<string, string> = {};

// Filenames a framework mandates verbatim — never subject to this repo's own
// casing convention because renaming them breaks the framework, not the style.
const FRAMEWORK_RESERVED_FILENAMES = new Set([
  'page.tsx',
  'layout.tsx',
  'template.tsx',
  'default.tsx',
  'error.tsx',
  'global-error.tsx',
  'loading.tsx',
  'not-found.tsx',
  'route.ts',
  'metadata.ts',
  'sitemap.ts',
  'robots.ts',
  'favicon.ico',
  'globals.css',
  'index.js', // Cloudflare Worker entry point — wrangler.jsonc's `main`
]);

// A test file may carry an extra descriptive suffix before `.test.ts(x)` —
// this repo's established second-tier convention for coverage-focused test
// files (`logic.coverage.test.ts`, `builders.synthetic-experience-coverage.test.ts`).
// Any number of kebab-case `.segment`s is accepted; the base name still has to
// match its role's casing.
const TEST_SUFFIX = String.raw`(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\.test`;

// Bare "logic.ts"/"engine.ts"/"builders.ts" (with or without a test suffix) is
// ambiguous the instant it's seen outside its own directory — a search
// result, an open editor tab, a stack trace. Generic KEBAB_CASE below would
// otherwise happily accept these (a single-segment word is valid kebab-case),
// so they must be rejected explicitly, not merely left unlisted as "also OK."
// ENGINEERING-STANDARDS §8.1 requires the qualified, directory-prefixed form
// (`hero-logic.ts`, `background-particles-engine.ts`) everywhere, no
// exceptions — `src/components/projects/` once held a bare `logic.ts` right
// beside `card-logic.ts` and `featured-logic.ts`, indistinguishable at a
// glance; fixed 2026-07 by qualifying all eleven bare `logic.ts` files plus
// the two bare `engine.ts` and the one bare `builders.ts` file repo-wide.
const BARE_LOGIC_FILE_NAME = new RegExp(`^(logic|engine|builders)(${TEST_SUFFIX})?\\.tsx?$`);
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.tsx?$/;
const KEBAB_CASE_TEST = new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*${TEST_SUFFIX}\\.tsx?$`);
const PASCAL_CASE_TSX = /^[A-Z][A-Za-z0-9]*\.tsx$/;
const PASCAL_CASE_TEST_TSX = new RegExp(`^[A-Z][A-Za-z0-9]*${TEST_SUFFIX}\\.tsx$`);
const HOOK_FILE = /^use[A-Za-z0-9]+\.tsx?$/;
const HOOK_TEST_FILE = new RegExp(`^use[A-Za-z0-9]+${TEST_SUFFIX}\\.tsx?$`);
const CAMEL_CASE_TS = /^[a-z][a-zA-Z0-9]*\.ts$/;
const CAMEL_CASE_TEST_TS = new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*${TEST_SUFFIX}\\.ts$`); // src/data's test convention is kebab-case

function listAllFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(SRC);
  return files;
}

function relPath(absPath: string): string {
  return relative(process.cwd(), absPath);
}

// ── Sweep 1: filename casing, keyed to directory role ────────────────────────

function checkFilenameCasing(absPath: string): string | null {
  const rel = relPath(absPath);
  const name = basename(absPath);
  const isTest = /\.test\.tsx?$/.test(name);

  if (FRAMEWORK_RESERVED_FILENAMES.has(name)) return null;
  if (!/\.(ts|tsx)$/.test(name)) return null; // non-source assets (favicon, css) exempt above; anything else isn't ours to police
  if (name.endsWith('.d.ts')) return null;

  const topDir = rel.split('/')[1]; // "src/<topDir>/..."

  if (topDir === 'data') {
    if (isTest) return CAMEL_CASE_TEST_TS.test(name) ? null : `src/data test files must be kebab-case + .test.ts (got "${name}")`;
    return CAMEL_CASE_TS.test(name) ? null : `src/data files must be camelCase .ts (got "${name}")`;
  }

  if (topDir === 'hooks') {
    if (isTest) return HOOK_TEST_FILE.test(name) || KEBAB_CASE_TEST.test(name) ? null : `src/hooks test files must be use*.test.ts(x) or kebab-case (got "${name}")`;
    return HOOK_FILE.test(name) ? null : `src/hooks files must be use*.ts(x) (got "${name}")`;
  }

  if (topDir === 'test-utils') {
    return KEBAB_CASE.test(name) || KEBAB_CASE_TEST.test(name) ? null : `src/test-utils files must be kebab-case (got "${name}")`;
  }

  // A bare logic/engine/builders module name is banned everywhere, before any
  // other check — it must be qualified with its directory's own name instead
  // (§8.1). Checked ahead of the PascalCase/kebab-case acceptance below,
  // since kebab-case alone would otherwise wave a single-segment word through.
  if (BARE_LOGIC_FILE_NAME.test(name)) {
    const parentDir = basename(dirname(absPath));
    return `bare "${name}" is banned — qualify it with the directory/component name (e.g. "${parentDir}-${name}") so it's unambiguous outside its own folder (§8.1)`;
  }

  // src/components/**, src/app/**, src/hooks-adjacent, and any other production dir:
  // a .tsx file is either a PascalCase component or a kebab-case logic/util file;
  // a .ts file is either a qualified logic-module name or kebab-case.
  if (extname(name) === '.tsx') {
    if (isTest) {
      return PASCAL_CASE_TEST_TSX.test(name) || KEBAB_CASE_TEST.test(name)
        ? null
        : `.tsx test files must be PascalCase.test.tsx (component) or kebab-case.test.tsx (utility) (got "${rel}")`;
    }
    return PASCAL_CASE_TSX.test(name) || KEBAB_CASE.test(name)
      ? null
      : `.tsx files must be PascalCase (component) or kebab-case (utility) (got "${rel}")`;
  }

  // .ts
  if (isTest) {
    return KEBAB_CASE_TEST.test(name)
      ? null
      : `.ts test files must be kebab-case.test.ts or match their logic module's name (got "${rel}")`;
  }
  return KEBAB_CASE.test(name) ? null : `.ts files must be *-logic.ts/*-engine.ts/*-builders.ts (qualified) or kebab-case (got "${rel}")`;
}

// ── Sweep 1b: a .tsx file's default export name must match its filename ─────
// Covers the two shapes that are, without exception, every default export in
// this repo's .tsx files (verified 2026-07): `export default function Name`
// and `export default memo(Name)`. Any other shape (arrow function, anonymous)
// is deliberately left unchecked rather than guessed at — a check that can't
// tell "no match" from "doesn't apply" is a false-positive machine.

function getDefaultExportName(absPath: string, source: string): string | null {
  const sourceFile = ts.createSourceFile(absPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const isDefault = (statement.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      const isExport = (statement.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (isDefault && isExport) return statement.name.text;
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const expr = statement.expression;
      if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression) && expr.arguments.length === 1) {
        const arg = expr.arguments[0];
        if (ts.isIdentifier(arg)) return arg.text; // export default memo(Name)
      }
      if (ts.isIdentifier(expr)) return expr.text; // export default Name
    }
  }
  return null;
}

// ── Sweep 2: lazy exported identifier names ──────────────────────────────────

// Exact-match denylist — a whole identifier equal to one of these, not a
// substring (so `buildScrambleHelper` or `utilityBeltCount` are unaffected).
// Case-insensitive on the bare word so `Data`/`data`/`DATA` all match.
const LAZY_IDENTIFIER_NAMES = new Set([
  'foo', 'bar', 'baz', 'qux',
  'temp', 'tmp',
  'data', 'obj', 'item', 'items',
  'thing', 'things', 'stuff', 'misc',
  'val', 'value', 'values', 'res', 'result',
  'helper', 'helpers', 'util', 'utils',
  'handler', 'manager', 'processor',
]);

function listExportedDeclarationNames(absPath: string, source: string): string[] {
  const sourceFile = ts.createSourceFile(
    absPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    absPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const isExported = (modifiers: readonly ts.ModifierLike[] | undefined) =>
    (modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  const names: string[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && isExported(statement.modifiers) && statement.name) {
      names.push(statement.name.text);
    }
    if (ts.isClassDeclaration(statement) && isExported(statement.modifiers) && statement.name) {
      names.push(statement.name.text);
    }
    if (ts.isVariableStatement(statement) && isExported(statement.modifiers)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) names.push(decl.name.text);
      }
    }
  }
  return names;
}

// ── Guard the guard (§6 item 8): a sweep that silently finds nothing is worse
// than no sweep — assert the parse actually walked real files. ──────────────

describe('naming-and-organization-contract — sweeps found real files', () => {
  it('walked a realistic number of source files', () => {
    const files = listAllFiles().filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.d.ts'));
    expect(files.length).toBeGreaterThanOrEqual(150);
  });
});

describe('naming-and-organization-contract — filenames follow their directory\'s convention (§8.1)', () => {
  it('every file matches the PascalCase-component / use*-hook / kebab-case-logic / camelCase-data shape', () => {
    const files = listAllFiles().filter((f) => /\.(ts|tsx)$/.test(f));
    const violations: string[] = [];
    for (const file of files) {
      const rel = relPath(file);
      if (rel in ALLOWED_FILENAME_EXCEPTIONS) continue;
      const violation = checkFilenameCasing(file);
      if (violation) violations.push(`  ${rel} — ${violation}`);
    }
    expect(
      violations,
      `${violations.length} filename convention violation(s) — rename to match the directory's convention, or add a reasoned ALLOWED_FILENAME_EXCEPTIONS entry:\n${violations.join('\n')}`,
    ).toEqual([]);
  });

  it('every .tsx file\'s default export name matches its filename, where the export shape is resolvable', () => {
    const files = listAllFiles().filter((f) => f.endsWith('.tsx') && !/\.test\.tsx$/.test(f));
    const violations: string[] = [];
    for (const file of files) {
      const rel = relPath(file);
      if (rel in ALLOWED_FILENAME_EXCEPTIONS) continue;
      const name = basename(file);
      if (FRAMEWORK_RESERVED_FILENAMES.has(name)) continue;
      const source = readFileSync(file, 'utf8');
      const exportName = getDefaultExportName(file, source);
      if (!exportName || !/^[A-Z]/.test(exportName)) continue; // unresolvable shape or non-component default — not this check's concern
      const expectedBase = `${exportName}.tsx`;
      if (name !== expectedBase) {
        violations.push(`  ${rel} — default-exports "${exportName}" but the file is named "${name}" (expected "${expectedBase}")`);
      }
    }
    expect(
      violations,
      `${violations.length} component filename/export mismatch(es):\n${violations.join('\n')}`,
    ).toEqual([]);
  });

  it('every ALLOWED_FILENAME_EXCEPTIONS entry has a real reason', () => {
    for (const [key, reason] of Object.entries(ALLOWED_FILENAME_EXCEPTIONS)) {
      expect(reason.length, `ALLOWED_FILENAME_EXCEPTIONS["${key}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});

describe('naming-and-organization-contract — no lazy exported identifier names (§8.2)', () => {
  it('no exported const/function/class uses a generic placeholder name', () => {
    const files = listAllFiles().filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith('.d.ts'));
    const violations: string[] = [];
    for (const file of files) {
      const rel = relPath(file);
      const source = readFileSync(file, 'utf8');
      for (const name of listExportedDeclarationNames(file, source)) {
        const key = `${rel}::${name}`;
        if (key in ALLOWED_LAZY_IDENTIFIER_EXCEPTIONS) continue;
        if (LAZY_IDENTIFIER_NAMES.has(name.toLowerCase())) {
          violations.push(`  ${key}`);
        }
      }
    }
    expect(
      violations,
      `${violations.length} lazily-named export(s) — rename to describe what it holds/does, or add a reasoned ALLOWED_LAZY_IDENTIFIER_EXCEPTIONS entry:\n${violations.join('\n')}`,
    ).toEqual([]);
  });

  it('every ALLOWED_LAZY_IDENTIFIER_EXCEPTIONS entry has a real reason', () => {
    for (const [key, reason] of Object.entries(ALLOWED_LAZY_IDENTIFIER_EXCEPTIONS)) {
      expect(reason.length, `ALLOWED_LAZY_IDENTIFIER_EXCEPTIONS["${key}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});
