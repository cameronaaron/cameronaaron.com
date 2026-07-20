/**
 * Regression test for the back-navigation blank-screen bug (2026-05).
 *
 * `SectionReveal` and `SectionHandoff` use `whileInView` to fade sections in.
 * When the user navigates back via the browser's bfcache, the IntersectionObserver
 * may not fire again (the elements are already in view from the prior pageshow),
 * leaving any section that starts at `opacity: 0` stuck and invisible.
 *
 * The fix: top-level section wrappers in `src/app/page.tsx` MUST use
 * `initial={false}` so the elements are visible by default and `whileInView`
 * is purely additive animation. Inner section content has its own animations
 * that are bfcache-resilient.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readPageSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');
}

function readSectionTransitionsSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/ui/SectionTransitions.tsx'), 'utf8');
}

/**
 * Extract the body of a top-level function declaration by name, using
 * brace-balancing so nested JSX/blocks are captured intact.
 */
function extractFunctionBody(src: string, name: string): string {
  const re = new RegExp(`function\\s+${name}\\s*\\(`, 'g');
  const match = re.exec(src);
  if (!match) throw new Error(`function ${name} not found`);
  // Find the opening brace after the signature.
  let i = match.index + match[0].length;
  let parenDepth = 1;
  while (i < src.length && parenDepth > 0) {
    if (src[i] === '(') parenDepth++;
    else if (src[i] === ')') parenDepth--;
    i++;
  }
  // Skip return-type annotation up to the first '{'.
  while (i < src.length && src[i] !== '{') i++;
  if (src[i] !== '{') throw new Error(`function ${name} body brace not found`);
  let depth = 1;
  const start = i;
  i++;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(start, i);
}

describe('Section wrapper bfcache safety', () => {
  it('SectionReveal outer wrapper is a framer-free plain div, so sections can never restore hidden from bfcache', () => {
    // Stronger than the old `initial={false}` assertion (2026-07): the wrapper
    // is now a plain <div>, not motion.div — no framer state at all means no
    // way to restore hidden after a back/forward-cache navigation, and no
    // framer mount cost (the homepage's real load gate). The first JSX element
    // the function returns must be a plain <div>, never <motion.*>.
    const body = extractFunctionBody(readSectionTransitionsSource(), 'SectionReveal');
    const afterReturn = body.slice(body.indexOf('return ('));
    expect(afterReturn).toMatch(/return \(\s*<div\b/);
    expect(afterReturn).not.toMatch(/return \(\s*<(?:motion|m)\./);
  });

  it('SectionHandoff outer wrapper is a framer-free plain div for the same reason', () => {
    const body = extractFunctionBody(readSectionTransitionsSource(), 'SectionHandoff');
    const afterReturn = body.slice(body.indexOf('return ('));
    expect(afterReturn).toMatch(/return \(\s*<div\b/);
    expect(afterReturn).not.toMatch(/return \(\s*<(?:motion|m)\./);
  });

  it('Home composes Hero inside a SectionReveal so the above-the-fold hero never starts hidden', () => {
    const body = extractFunctionBody(readPageSource(), 'Home');
    expect(body).toMatch(/<SectionReveal[^>]*index=\{0\}>\s*<Hero\s*\/>/);
  });
});
