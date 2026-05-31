/**
 * Regression tests for the back-navigation blank-screen bug (2026-05).
 *
 * Root cause: components read `sessionStorage` / `performance.getEntriesByType`
 * inside `useState` initializers. Server and client diverge → React aborts
 * hydration → ancestor `SectionReveal` wrappers get stuck at `opacity: 0`
 * → page appears blank until full reload.
 *
 * Two complementary guards:
 *   1. Source-code lint: forbid client-only reads inside `useState(...)` calls
 *      for the affected files.
 *   2. Behavioral SSR test: render each component via `renderToString` twice
 *      (with and without the "skip" sessionStorage marker) — markup MUST be
 *      identical. Whatever the client sees first must match what SSR emitted.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import IntroCurtain from './ui/IntroCurtain';
import TypewriterEffect from './ui/TypewriterEffect';

const TYPEWRITER_STORAGE_KEY = 'typewriter-complete:Cameron Aaron';
const INTRO_CURTAIN_STORAGE_KEY = 'intro-curtain-shown';

function mockNavigationType(type: 'navigate' | 'back_forward' | 'reload') {
  vi.spyOn(performance, 'getEntriesByType').mockImplementation((name: string) => {
    if (name === 'navigation') {
      return [{ type } as unknown as PerformanceEntry];
    }
    return [];
  });
}

describe('SSR/client first-paint parity (hydration safety)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  describe('IntroCurtain', () => {
    it('renders identical markup regardless of sessionStorage state', () => {
      mockNavigationType('navigate');
      const fresh = renderToString(<IntroCurtain holdMs={500} />);

      window.sessionStorage.setItem(INTRO_CURTAIN_STORAGE_KEY, '1');
      const seen = renderToString(<IntroCurtain holdMs={500} />);

      expect(fresh).toBe(seen);
    });

    it('renders identical markup regardless of navigation type', () => {
      mockNavigationType('navigate');
      const navigate = renderToString(<IntroCurtain holdMs={500} />);

      mockNavigationType('back_forward');
      const backForward = renderToString(<IntroCurtain holdMs={500} />);

      expect(navigate).toBe(backForward);
    });

    it('renders the curtain (not a blank fragment) on first paint', () => {
      mockNavigationType('navigate');
      const html = renderToString(<IntroCurtain holdMs={500} />);
      // SSR output must include the curtain — otherwise client will try to
      // mount it after hydration and trigger a mismatch.
      expect(html).toContain('intro-curtain');
    });
  });

  describe('TypewriterEffect', () => {
    it('renders identical markup regardless of sessionStorage state', () => {
      mockNavigationType('navigate');
      const fresh = renderToString(
        <TypewriterEffect text="Cameron Aaron" typingSpeed={80} />
      );

      window.sessionStorage.setItem(TYPEWRITER_STORAGE_KEY, '1');
      const seen = renderToString(
        <TypewriterEffect text="Cameron Aaron" typingSpeed={80} />
      );

      expect(fresh).toBe(seen);
    });

    it('renders identical markup regardless of navigation type', () => {
      mockNavigationType('navigate');
      const navigate = renderToString(
        <TypewriterEffect text="Cameron Aaron" typingSpeed={80} />
      );

      mockNavigationType('back_forward');
      const backForward = renderToString(
        <TypewriterEffect text="Cameron Aaron" typingSpeed={80} />
      );

      expect(navigate).toBe(backForward);
    });

    it('SSR output starts with the first character only (matches client first paint)', () => {
      mockNavigationType('navigate');
      window.sessionStorage.setItem(TYPEWRITER_STORAGE_KEY, '1');
      const html = renderToString(
        <TypewriterEffect text="Cameron Aaron" typingSpeed={80} />
      );
      // The visible (aria-hidden) span must show "C", not the full text,
      // even when sessionStorage says the animation is complete.
      // Full text appears only in the sr-only span.
      expect(html).toContain('aria-hidden="true">C</span>');
      // sr-only always carries the full string for screen readers.
      expect(html).toContain('Cameron Aaron');
    });
  });
});

describe('Source-code guard: useState initializers must not read client-only state', () => {
  const FORBIDDEN_FILES = [
    'src/components/ui/IntroCurtain.tsx',
    'src/components/ui/TypewriterEffect.tsx',
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
