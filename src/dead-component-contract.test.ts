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
 * A component only belongs in ALLOWED_UNUSED_COMPONENTS with a specific,
 * individually-written reason — not a blanket "kept as scaffolding" excuse.
 * (2026-07: this list previously held Card/FadeInWhenVisible/ParallaxSection/
 * ScrollReveal as a bare Set with one shared comment and no per-entry
 * reasoning, and no test enforcing one existed — exactly the "whitelisted
 * because it's easier than deleting it" pattern ENGINEERING-STANDARDS.md's
 * anti-lazy-exemption rule now bans. Investigated and deleted: none had a
 * test of their own, none were used by ANY production code — only by
 * ui-smoke.test.tsx, which is how they cleared the 100% coverage gate while
 * being fully dead — none respected prefersReducedMotion/performanceTier at
 * all despite every other animated component in this codebase being required
 * to, and every one duplicated a pattern (SpotlightCard for cards, inline
 * useScroll/useTransform for parallax/reveal, already used in 12+ real
 * components) that was already the established approach. "Might want this
 * generic primitive again someday" was the whole case for keeping them, and
 * it wasn't backed by an actual plan — a portfolio site's section list
 * doesn't grow the way a component library's consumer surface does.)
 * Required shape: Record<name, reason>, same as ALLOWED_UNUSED_LOGIC_EXPORTS,
 * ALLOWED_COMPLEXITY_EXCEPTIONS, ALLOWED_LIFECYCLE_EXCEPTIONS, and
 * PINNED_WITH_REASON — every exemption list in this repo enforces a real,
 * per-entry reason via its own test; this one now does too.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());

/** "ComponentName" → reason. Empty until a genuinely justified case appears. */
const ALLOWED_UNUSED_COMPONENTS: Record<string, string> = {};

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
      if (decl.name in ALLOWED_UNUSED_COMPONENTS) continue;

      const tagPattern = new RegExp(`<${decl.name}[\\s/>]`);
      // A lazily-imported component is a real production caller even though it
      // never appears as a literal JSX tag at the import site: the tag is
      // `<Demo />` on a variable holding the dynamic() result. Added 2026-07-25
      // when the project games moved behind an InteractiveDemoSlot dispatch
      // table (§2.2) — the sweep reported four live, rendered games as dead.
      // This was a pre-existing blind spot in the *pattern*, not a consequence
      // of that refactor (§6 item 7: ask a sweep what it would miss); it would
      // have false-flagged ANY next/dynamic-imported component. Matching the
      // module path keeps the check honest — an import alone still isn't
      // usage unless it is a real dynamic() render path.
      const modulePath = decl.file.replace(`${ROOT}/src/`, '@/').replace(/\.tsx?$/, '');
      const lazyPattern = new RegExp(`dynamic\\(\\s*\\(\\)\\s*=>\\s*import\\(['"]${modulePath.replace(/[/.]/g, '\\$&')}['"]`);
      const usedElsewhere = files.some(
        (f) => f !== decl.file && (tagPattern.test(sources.get(f)!) || lazyPattern.test(sources.get(f)!))
      );

      if (!usedElsewhere) {
        dead.push(
          `  ${decl.name} (${decl.file.replace(`${ROOT}/`, '')}) — no JSX usage or dynamic import outside its own file`
        );
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
    for (const name of Object.keys(ALLOWED_UNUSED_COMPONENTS)) {
      expect(declaredNames.has(name), `Exempted component "${name}" no longer exists — remove its exemption`).toBe(
        true,
      );
    }
  });

  it('every ALLOWED_UNUSED_COMPONENTS entry has a real, specific reason — not a placeholder', () => {
    for (const [name, reason] of Object.entries(ALLOWED_UNUSED_COMPONENTS)) {
      expect(reason.length, `ALLOWED_UNUSED_COMPONENTS["${name}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});
