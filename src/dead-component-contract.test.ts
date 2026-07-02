/**
 * Dead-component contract.
 *
 * Closes the other half of the hole found during the 2026-07 cleanup: a
 * component can be fully built, tested, and covered at 100% while never
 * actually being rendered by any real page (`FAQ.tsx` was — content, a11y
 * tests, smoke tests, all green — but `src/app/page.tsx` never mounted it).
 * The 100% coverage gate cannot catch this class of dead code: a component
 * whose *only* caller is its own test file has full statement/branch coverage
 * and looks exactly like a component that's actually shipping.
 *
 * This sweep asks a different question than coverage does: "is this
 * component's exported name used as a JSX tag anywhere in PRODUCTION code
 * (src/app or src/components, excluding the component's own file and any
 * *.test.* file)?" Test-only usage does not count — that's precisely the
 * FAQ situation this contract exists to catch.
 *
 * A handful of components are deliberate reusable primitives not currently
 * wired into any page — kept intentionally as scaffolding rather than
 * deleted. Each is listed in ALLOWED_UNUSED_COMPONENTS with the reasoning,
 * the same pattern as PUBLIC_CONVENTION_EXEMPT in the sibling
 * public-assets-freshness-contract.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());

// Confirmed during the 2026-07 organization-cleanup session: these are
// generic reusable primitives with no current callers. Decision was to keep
// them as scaffolding for future sections rather than delete. Revisit if
// this list grows much further — a component nobody reaches for after a few
// months is a stronger signal to delete than to keep waiting.
const ALLOWED_UNUSED_COMPONENTS = new Set(['Card', 'FadeInWhenVisible', 'ParallaxSection', 'ScrollReveal']);

const DEFAULT_EXPORT_RE = /export default (?:function )?(\w+)|export default memo\((\w+)\)/g;
const NAMED_EXPORT_RE = /export function (\w+)\(/g;

interface ComponentDecl {
  name: string;
  file: string;
}

// Next.js App Router file-convention entry points — mounted by the router
// via file path, never referenced as a JSX tag anywhere in the codebase.
// They must still be SEARCHED for usage of other components (page.tsx is
// where most sections get mounted) — they're just not themselves candidate
// "components" to check for callers.
const ROUTE_CONVENTION_FILES = new Set(['page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx']);

/** Every production .tsx file — the search corpus for "is X used anywhere?" */
function listProductionTsxFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
        files.push(full);
      }
    }
  };
  walk(join(ROOT, 'src', 'components'));
  walk(join(ROOT, 'src', 'app'));
  return files;
}

/** Files whose exports are candidate "components" to check for a caller. */
function listComponentCandidateFiles(allFiles: string[]): string[] {
  return allFiles.filter((f) => !ROUTE_CONVENTION_FILES.has(f.split('/').pop()!));
}

function extractComponentDecls(file: string, src: string): ComponentDecl[] {
  const decls: ComponentDecl[] = [];

  for (const match of src.matchAll(DEFAULT_EXPORT_RE)) {
    const name = match[1] ?? match[2];
    // Skip decls whose "name" is actually a JSX/object literal artifact —
    // only capitalized identifiers are components.
    if (name && /^[A-Z]/.test(name)) decls.push({ name, file });
  }
  for (const match of src.matchAll(NAMED_EXPORT_RE)) {
    const name = match[1];
    if (name && /^[A-Z]/.test(name)) decls.push({ name, file });
  }

  return decls;
}

describe('dead-component-contract — every component is used by production code, not just its own test', () => {
  it('finds component declarations to check (sanity guard against a silently-empty sweep)', () => {
    const candidates = listComponentCandidateFiles(listProductionTsxFiles());
    const all = candidates.flatMap((f) => extractComponentDecls(f, readFileSync(f, 'utf8')));
    expect(all.length).toBeGreaterThan(20);
  });

  it('every exported component is referenced as a JSX tag in some OTHER production file', () => {
    const files = listProductionTsxFiles();
    const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
    const decls = listComponentCandidateFiles(files).flatMap((f) => extractComponentDecls(f, sources.get(f)!));

    const dead: string[] = [];
    for (const decl of decls) {
      if (ALLOWED_UNUSED_COMPONENTS.has(decl.name)) continue;

      const tagPattern = new RegExp(`<${decl.name}[\\s/>]`);
      const usedElsewhere = files.some((f) => f !== decl.file && tagPattern.test(sources.get(f)!));

      if (!usedElsewhere) {
        dead.push(`  ${decl.name} (${decl.file.replace(`${ROOT}/`, '')}) — no JSX usage outside its own file`);
      }
    }

    expect(
      dead,
      `${dead.length} component(s) with zero production callers — render them, delete them, or add to ` +
        `ALLOWED_UNUSED_COMPONENTS with a reason:\n${dead.join('\n')}`,
    ).toEqual([]);
  });

  it('every ALLOWED_UNUSED_COMPONENTS entry still exists as a real component (no stale exemptions)', () => {
    const candidates = listComponentCandidateFiles(listProductionTsxFiles());
    const declaredNames = new Set(
      candidates.flatMap((f) => extractComponentDecls(f, readFileSync(f, 'utf8'))).map((d) => d.name),
    );
    for (const name of ALLOWED_UNUSED_COMPONENTS) {
      expect(declaredNames.has(name), `Exempted component "${name}" no longer exists — remove its exemption`).toBe(
        true,
      );
    }
  });
});
