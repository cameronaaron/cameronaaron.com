/**
 * Dead logic-export contract.
 *
 * dead-component-contract asks whether a component is rendered by real
 * production code; this asks the same question one level down: is every
 * exported *function* of a logic module (*-logic.ts / *-engine.ts /
 * *-builders.ts — ENGINEERING-STANDARDS §8.1 requires the qualified,
 * directory-prefixed form repo-wide since 2026-07) actually used by
 * production code?
 *
 * The failure mode it closes (found 2026-07): navigation/logic.ts (since
 * renamed navigation-logic.ts) exported getActiveNavLabel — an O(n)
 * Array.find lookup superseded by buildNavLabelMap months earlier. Its only
 * caller was its own test, which the 100% coverage gate cannot distinguish
 * from a real caller. Dead exports rot: they keep old (often slower) patterns
 * alive as copy-paste bait and cost test maintenance.
 *
 * An export counts as alive if:
 *   a) any OTHER production source references its name, or
 *   b) its own module calls it (helpers exported only for direct unit testing
 *      are legitimate under the testability doctrine — createSeededRandom).
 * Exported constants and types are exempt: the named-constants doctrine
 * requires exporting them for tests even when only the module uses them.
 *
 * Deliberate exceptions go in ALLOWED_UNUSED_LOGIC_EXPORTS with a reason —
 * a decision on record, not a loophole.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'src');

/** "module.ts::exportName" → reason */
const ALLOWED_UNUSED_LOGIC_EXPORTS: Record<string, string> = {};

const LOGIC_FILE = /(-logic\.ts$|-engine\.ts$|-builders\.ts$)/;

function listSources(): string[] {
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

/** Every top-level exported function name in a module — function declarations
 * AND `export const name = (...) => {}` / `export const name = function () {}`
 * arrow/function-expression exports. The prior regex (`^export function
 * (\w+)`) only matched the declaration form: converting a logic module's
 * export style to a const arrow (a purely stylistic, entirely ordinary
 * refactor) would silently remove it from this sweep forever. Parsed with the
 * real TypeScript compiler rather than a broader regex, since a second regex
 * has the exact same "only matches the shapes it was written against" limit
 * — e.g. it still wouldn't catch a re-export (`export { name }`). */
function listExportedFunctionNames(file: string, src: string): string[] {
  const sourceFile = ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const isExported = (modifiers: readonly ts.ModifierLike[] | undefined) =>
    (modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  const names: string[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && isExported(statement.modifiers) && statement.name) {
      names.push(statement.name.text);
      continue;
    }
    if (ts.isVariableStatement(statement) && isExported(statement.modifiers)) {
      for (const decl of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          names.push(decl.name.text);
        }
      }
    }
  }
  return names;
}

describe('dead-logic-export-contract — every exported logic function has a production caller', () => {
  it('no logic module exports a function used only by tests', () => {
    const sources = listSources();
    const logicModules = sources.filter((file) => LOGIC_FILE.test(basename(file)));
    const otherSourceText = new Map(sources.map((file) => [file, readFileSync(file, 'utf8')]));

    const dead: string[] = [];
    for (const mod of logicModules) {
      const src = otherSourceText.get(mod)!;
      for (const name of listExportedFunctionNames(mod, src)) {
        const key = `${basename(mod)}::${name}`;
        if (key in ALLOWED_UNUSED_LOGIC_EXPORTS) continue;

        // a) referenced by any other production source
        let alive = false;
        for (const [file, text] of otherSourceText) {
          if (file !== mod && text.includes(name)) {
            alive = true;
            break;
          }
        }

        // b) called inside its own module (occurrences beyond the declaration)
        if (!alive) {
          const occurrences = src.split(name).length - 1;
          alive = occurrences > 1;
        }

        if (!alive) dead.push(`  ${mod.replace(`${SRC}/`, 'src/')} :: ${name}`);
      }
    }

    expect(
      dead,
      `${dead.length} dead logic export(s) — only tests use them. Delete the function (and its tests), wire it into production, or add a reasoned ALLOWED_UNUSED_LOGIC_EXPORTS entry:\n${dead.join('\n')}`,
    ).toEqual([]);
  });

  it('every ALLOWED_UNUSED_LOGIC_EXPORTS entry has a real reason', () => {
    for (const [key, reason] of Object.entries(ALLOWED_UNUSED_LOGIC_EXPORTS)) {
      expect(reason.length, `ALLOWED_UNUSED_LOGIC_EXPORTS["${key}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});
