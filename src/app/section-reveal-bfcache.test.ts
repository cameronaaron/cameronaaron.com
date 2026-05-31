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
  it('SectionReveal outer wrapper uses initial={false} so sections are visible after bfcache restore', () => {
    const body = extractFunctionBody(readPageSource(), 'SectionReveal');
    const outerWrapper = extractFirstMotionDivProps(body);
    expect(outerWrapper).toMatch(/initial=\{false\}/);
    expect(outerWrapper).not.toMatch(/opacity:\s*0/);
  });

  it('SectionHandoff outer wrapper uses initial={false} for the same reason', () => {
    const body = extractFunctionBody(readPageSource(), 'SectionHandoff');
    const outerWrapper = extractFirstMotionDivProps(body);
    expect(outerWrapper).toMatch(/initial=\{false\}/);
    expect(outerWrapper).not.toMatch(/opacity:\s*0/);
  });

  it('Home composes Hero inside a SectionReveal so the above-the-fold hero never starts hidden', () => {
    const body = extractFunctionBody(readPageSource(), 'Home');
    expect(body).toMatch(/<SectionReveal[^>]*index=\{0\}>\s*<Hero\s*\/>/);
  });
});

/**
 * Return the JSX prop block of the first `<motion.div ...>` tag in `body`
 * (everything between the opening `<motion.div` and the matching `>`).
 */
function extractFirstMotionDivProps(body: string): string {
  const start = body.indexOf('<motion.div');
  if (start === -1) throw new Error('no <motion.div> in body');
  let i = start;
  let depth = 0;
  let inString: string | null = null;
  while (i < body.length) {
    const c = body[i];
    if (inString) {
      if (c === inString && body[i - 1] !== '\\') inString = null;
    } else if (c === '"' || c === "'") {
      inString = c;
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
    } else if (c === '>' && depth === 0) {
      return body.slice(start, i + 1);
    }
    i++;
  }
  throw new Error('unterminated <motion.div> tag');
}
