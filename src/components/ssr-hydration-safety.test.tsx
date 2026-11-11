
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Source-code guard: useState initializers must not read client-only state', () => {
  // Every component that still persists something across visits or reads the
  // navigation type. The two files this guard was written for (the intro
  // curtain and the typewriter name) were removed in the 2026-11 redesign; the
  // pattern they taught applies to whatever does the same job now.
  const FORBIDDEN_FILES = [
    'src/components/ui/LocalTimeStatus.tsx',
    'src/components/ui/KeyboardShortcuts.tsx',
    'src/components/ui/CommandPalette.tsx',
    'src/components/ui/BackToTop.tsx',
    'src/components/Navigation.tsx',
  ];

  // Patterns that indicate a `useState(...)` initializer is branching on
  // client-only browser state — the exact pattern that caused the bug.
  const CLIENT_ONLY_READS = [
    /sessionStorage/,
    /localStorage/,
    /performance\.getEntriesByType/,
    /navigator\./,
    /document\./,
    /window\.matchMedia/,
  ];

  for (const relPath of FORBIDDEN_FILES) {
    it(`${relPath}: no useState initializer reads client-only state`, () => {
      const abs = resolve(process.cwd(), relPath);
      const src = readFileSync(abs, 'utf8');

      // Extract every `useState(` argument expression up to the matching paren.
      const initializers = extractUseStateInitializers(src);
      expect(initializers.length).toBeGreaterThan(0);

      for (const initializer of initializers) {
        for (const forbidden of CLIENT_ONLY_READS) {
          expect(
            forbidden.test(initializer),
            `useState initializer in ${relPath} reads ${forbidden.source}:\n  ${initializer.trim()}\n` +
              `→ This causes server/client divergence and breaks hydration. ` +
              `Move the read into a useLayoutEffect/useEffect that updates state after mount.`
          ).toBe(false);
        }
      }
    });
  }
});

/**
 * Scan source text for every `useState(<expr>)` call and return the raw
 * argument expression. Uses a paren-balancing walk so multi-line / nested
 * function expressions are captured intact.
 */
function extractUseStateInitializers(src: string): string[] {
  const results: string[] = [];
  const re = /\buseState\s*(?:<[^>]*>)?\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src)) !== null) {
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    let inString: string | null = null;
    let inTemplate = false;
    while (i < src.length && depth > 0) {
      const c = src[i];
      const prev = src[i - 1];
      if (inString) {
        if (c === inString && prev !== '\\') inString = null;
      } else if (inTemplate) {
        if (c === '`' && prev !== '\\') inTemplate = false;
      } else if (c === '"' || c === "'") {
        inString = c;
      } else if (c === '`') {
        inTemplate = true;
      } else if (c === '(') {
        depth++;
      } else if (c === ')') {
        depth--;
      }
      i++;
    }
    results.push(src.slice(start, i - 1));
  }
  return results;
}
