/**
 * SSR hydration safety contract.
 *
 * Prevents React #418 "Hydration failed" errors caused by useState lazy initializers
 * that read browser APIs (window, navigator, document, sessionStorage, etc.).
 *
 * HOW THE BUG WORKS
 * -----------------
 * Next.js `output: 'export'` pre-renders all pages at build time in a Node.js
 * environment where window/navigator/sessionStorage are undefined. The resulting
 * static HTML always reflects the "browser-absent" state (e.g. isCoarsePointer=false).
 *
 * On the client, React hydrates by comparing its first render against the SSR HTML.
 * `useState(() => expr)` lazy initializers run SYNCHRONOUSLY during that first render —
 * before React finishes reconciliation. If `expr` reads a real browser API (returning
 * a different value than it would in Node.js), the client's initial virtual DOM differs
 * from the static HTML → React throws error #418 and falls back to a full client render,
 * causing a flash / layout shift.
 *
 * INCIDENTS
 * ---------
 * 1. usePerformanceProfile (2026-06): lazy initializers read window.matchMedia() and
 *    navigator.hardwareConcurrency → always mismatched on mobile. Fixed by switching
 *    all three useState() calls to useState(false) with real detection in useEffect.
 *
 * 2. TextReveal (2026-06): lazy initializer called readInitialReveal() which reads
 *    sessionStorage and performance.getEntriesByType() → mismatched on return visits
 *    in the same session. Fixed by the same useState(false) + useEffect pattern.
 *
 * THE RULE
 * --------
 * In any 'use client' file, useState lazy initializers must NOT read browser APIs —
 * either directly or by calling a function (in the same file or an imported module)
 * that reads browser APIs.
 *
 * THE FIX PATTERN
 * ---------------
 *   // ❌ wrong — reads browser API during hydration
 *   const [x, setX] = useState(() => window.matchMedia('...').matches);
 *
 *   // ✅ correct — false matches SSR; real value set post-hydration
 *   const [x, setX] = useState(false);
 *   useEffect(() => { setX(window.matchMedia('...').matches); }, []);
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = resolve(PROJECT_ROOT, 'src');

/**
 * Browser APIs that are undefined at SSR/build time, PLUS non-deterministic
 * APIs that ARE defined in both environments but return a different value
 * each time (the current date, a random number) — reading either at lazy-
 * initializer time produces a value that can never match the statically
 * built HTML, which is the same class of #418 mismatch as a genuinely
 * undefined API. Found 2026-07 while building this repo's own hydration-safe
 * live-clock pattern (LocalTimeStatus, Certifications' expiry status): this
 * contract only checked for undefined-at-SSR APIs and would have missed a
 * `useState(() => new Date())`-style regression entirely.
 */
const BROWSER_API_PATTERNS = [
  'window.',
  'navigator.',
  'document.',
  'sessionStorage.',
  'localStorage.',
  'performance.get',
  'performance.now',
  'location.',
  'new Date(',
  'Date.now(',
  'Math.random(',
];

function walkSrc(): string[] {
  function walk(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      const full = resolve(dir, e.name);
      if (e.isDirectory()) {
        files.push(...walk(full));
      } else if (e.isFile()) {
        const name = basename(full);
        if ((name.endsWith('.ts') || name.endsWith('.tsx')) && !name.includes('.test.') && !name.includes('.spec.')) {
          files.push(full);
        }
      }
    }
    return files;
  }
  return walk(SRC_ROOT);
}

function resolveImportPath(fromFile: string, importPath: string): string | null {
  let base: string;
  if (importPath.startsWith('@/')) {
    base = resolve(SRC_ROOT, importPath.slice(2));
  } else if (importPath.startsWith('.')) {
    base = resolve(dirname(fromFile), importPath);
  } else {
    return null;
  }

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function readsBrowserApis(source: string): boolean {
  return BROWSER_API_PATTERNS.some((api) => source.includes(api));
}

describe('SSR hydration safety contract', () => {
  it('no "use client" file uses a useState lazy initializer that reads browser APIs', () => {
    // A lazy initializer is the () => expr form: useState(() => something).
    // It runs synchronously during the client's first render (before hydration
    // completes), so any browser API it reads can mismatch the SSR HTML → #418.

    const allSourceFiles = walkSrc();
    const violations: string[] = [];

    for (const file of allSourceFiles) {
      const source = readFileSync(file, 'utf8');
      const trimmed = source.trimStart();

      if (!trimmed.startsWith("'use client'") && !trimmed.startsWith('"use client"')) continue;

      const lazyInitRegex = /useState\s*\(\s*\(\s*\)\s*=>/g;
      let match: RegExpExecArray | null;

      while ((match = lazyInitRegex.exec(source)) !== null) {
        const pos = match.index;
        const fragment = source.slice(pos, pos + 600);
        const rel = relative(PROJECT_ROOT, file);

        // 1. Direct browser API read inside the lambda body
        if (readsBrowserApis(fragment)) {
          violations.push(`${rel}: useState lazy initializer directly reads browser APIs`);
          continue;
        }

        // 2. Lambda calls a named function: useState(() => fnName(...)
        const callMatch = fragment.match(/\(\s*\)\s*=>\s*(\w+)\s*\(/);
        if (!callMatch?.[1]) continue;
        const calledFn = callMatch[1];

        // 2a. Check the function definition in the same file
        // Handles both `function fnName(...)` and `const fnName = (...) =>`
        const sameFnRegex = new RegExp(
          `(?:function\\s+${calledFn}\\b|const\\s+${calledFn}\\s*=\\s*(?:\\([^)]*\\)|\\w+)\\s*=>)[\\s\\S]{0,800}?(?=\\n(?:export\\s+)?(?:function|const|class)|$)`,
          'g'
        );
        const sameFnMatch = sameFnRegex.exec(source);
        if (sameFnMatch && readsBrowserApis(sameFnMatch[0])) {
          violations.push(
            `${rel}: useState lazy initializer calls "${calledFn}" (same file) which reads browser APIs`
          );
          continue;
        }

        // 2b. Check the imported module if the function is imported
        const importRegex = new RegExp(
          `import[^;]*\\{[^}]*\\b${calledFn}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`
        );
        const importMatch = source.match(importRegex);
        if (importMatch?.[1]) {
          const importedFilePath = resolveImportPath(file, importMatch[1]);
          if (importedFilePath) {
            const importedSource = readFileSync(importedFilePath, 'utf8');
            // Find just the function's body in the imported file
            const importedFnRegex = new RegExp(
              `(?:function\\s+${calledFn}\\b|export\\s+function\\s+${calledFn}\\b)[\\s\\S]{0,600}?(?=\\n(?:export\\s+)?function|$)`,
              'g'
            );
            const importedFnMatch = importedFnRegex.exec(importedSource);
            if (importedFnMatch && readsBrowserApis(importedFnMatch[0])) {
              violations.push(
                `${rel}: useState lazy initializer calls imported "${calledFn}" (from ${importMatch[1]}) which reads browser APIs`
              );
            } else if (!importedFnMatch && readsBrowserApis(importedSource)) {
              // Couldn't extract just the function body but the whole file reads browser APIs —
              // flag conservatively; check manually.
              violations.push(
                `${rel}: useState lazy initializer calls "${calledFn}" imported from ${importMatch[1]} — unable to isolate function body; that file reads browser APIs (verify manually)`
              );
            }
          }
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([]);
  });
});
