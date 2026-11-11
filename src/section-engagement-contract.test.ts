/**
 * Section engagement contract.
 *
 * This site's whole design direction (2026-07) is that the page should react
 * to the user — hovering, clicking, or watching a real value change should
 * always give something back, never sit inert. This sweep is a FLOOR, not a
 * quality score: it can't measure whether an interaction is actually good,
 * only whether a top-level page section contains at least one genuine
 * user-reactive element (a real event handler wired to a state/DOM change,
 * a live-region status message, or an import of one of this repo's proven
 * interactive primitives) rather than zero. Found and fixed 2026-07:
 * Education had nothing but a passive CSS `animate-ping` dot — no hover,
 * click, or focus interaction anywhere in the section — fixed by giving
 * each credential a real hover response. A section could still legitimately fail this for a new,
 * as-yet-unbuilt section; the fix is to add ONE real interactive touch, not
 * to loosen the check.
 *
 * Qualifying signals deliberately include the imperative
 * `addEventListener('mouseenter', ...)` pattern (not just JSX `onMouseEnter`
 * props) because performance-conscious hover components write directly to the
 * DOM node to avoid a React re-render on every pointer move
 * (ENGINEERING-STANDARDS §3.1).
 *
 * They also include `mark-link`, the highlighter swipe (2026-11 redesign). A
 * hover that is pure CSS is the cheapest reaction there is — no handler, no
 * hydration — and a JS-only pattern match could not see it, so it would have
 * pushed the server-rendered Hero and Contact sections back toward shipping
 * client code just to be counted. Because a class name is only a claim, the
 * last test below proves globals.css really answers hover AND keyboard focus
 * for it.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'src');
const COMPONENTS = join(SRC, 'components');

/** Section.tsx name -> its matching lowercase sub-directory, by this repo's own convention. */
const SECTIONS: Record<string, string> = {
  Hero: 'hero',
  Certifications: 'certifications',
  Experience: 'experience',
  Education: 'education',
  Projects: 'projects',
  Skills: 'skills',
  Testimonials: 'testimonials',
  Contact: 'contact',
};

const DIRECT_INTERACTIVE_PATTERN =
  /onMouseEnter|onMouseMove|onClick|onFocus|whileHover|whileTap|aria-live|role="status"|onTouchStart|addEventListener\('(?:mouse|click|touch|pointer)/;

/** Shared primitives already proven interactive elsewhere — importing one counts. */
const KNOWN_INTERACTIVE_PRIMITIVE_PATTERN = /\bmark-link\b/;

function listFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function readSectionSource(sectionFile: string, subDir: string): string {
  const topLevelPath = join(COMPONENTS, `${sectionFile}.tsx`);
  const parts = [readFileSync(topLevelPath, 'utf8')];
  for (const file of listFiles(join(COMPONENTS, subDir))) {
    parts.push(readFileSync(file, 'utf8'));
  }
  return parts.join('\n');
}

describe('section-engagement-contract — every top-level section reacts to the user', () => {
  it('every section file (or its sub-directory) contains at least one genuine interactive signal', () => {
    const offenders: string[] = [];

    for (const [sectionFile, subDir] of Object.entries(SECTIONS)) {
      const source = readSectionSource(sectionFile, subDir);
      const hasDirectPattern = DIRECT_INTERACTIVE_PATTERN.test(source);
      const hasKnownPrimitive = KNOWN_INTERACTIVE_PRIMITIVE_PATTERN.test(source);
      if (!hasDirectPattern && !hasKnownPrimitive) {
        offenders.push(`  ${sectionFile} (src/components/${subDir}/) — no interactive signal found anywhere`);
      }
    }

    expect(
      offenders,
      `section(s) with zero user-reactive content — add a real hover/click/focus interaction, a live-region status message, or the mark-link highlighter:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('the SECTIONS registry matches every real top-level section component', () => {
    // Self-cleaning: if a new page section is added without registering it
    // here, this sweep silently stops covering it — as blind as having no
    // sweep at all.
    const topLevelFiles = readdirSync(COMPONENTS, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.tsx$/.test(entry.name))
      .map((entry) => entry.name.replace(/\.tsx$/, ''));

    for (const name of Object.keys(SECTIONS)) {
      expect(topLevelFiles, `SECTIONS["${name}"] names a file that no longer exists`).toContain(name);
    }
  });

  it('mark-link really reacts: globals.css answers both hover and keyboard focus', () => {
    // KNOWN_INTERACTIVE_PRIMITIVE_PATTERN trusts a class name. This is what
    // makes that trust safe — delete or rename the rule and the sections that
    // rely on it stop counting as interactive here, not silently in production.
    const css = readFileSync(join(SRC, 'app', 'globals.css'), 'utf8');
    const resting = css.match(/\.mark-link\s*\{[^}]*\}/)?.[0] ?? '';
    const active = css.match(/\.mark-link:hover,[^{]*\{[^}]*\}/)?.[0] ?? '';

    expect(resting, 'resting .mark-link rule missing').toContain('background-size: 0%');
    expect(active, 'active .mark-link rule missing').toContain('.mark-link:focus-visible');
    expect(active).toContain('background-size: 100%');
  });
});
