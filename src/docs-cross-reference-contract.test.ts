import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Docs cross-reference integrity.
 *
 * ENGINEERING-STANDARDS.md and CLAUDE.md are dense with internal pointers —
 * "§4.7", "§6 item 13", "CLAUDE.md constraint #17" — and §0 (the first-
 * principles doctrine) leans on several of them by name. markdownlint
 * (docs-quality-contract) checks formatting, not whether a pointer resolves,
 * so before this contract a section renumber or a deleted constraint would
 * silently turn every reference to it into a lie with a green gate.
 *
 * This walks the actual heading / list structure of both docs, then verifies
 * every reference resolves to something that exists. It is a forward guard: all
 * references resolve today, so it passes now and only fails when a future edit
 * removes or renumbers a referenced target — the same drift class the freshness
 * contracts (ratchet §6 item 4) and the "audit the pattern" sweeps (item 7)
 * already close for other ecosystems. Fix the SOURCE when it fails: either
 * restore the target's number or update the reference — never delete the check.
 */

const ROOT = process.cwd();
const ENGINEERING = 'ENGINEERING-STANDARDS.md';
const CLAUDE = 'CLAUDE.md';

function readDoc(file: string): string {
  return readFileSync(join(ROOT, file), 'utf8');
}

const engineeringText = readDoc(ENGINEERING);
const claudeText = readDoc(CLAUDE);
const engineeringLines = engineeringText.split('\n');
const claudeLines = claudeText.split('\n');

// ── Resolution targets, parsed from the real document structure ──────────────

// `## N. …` top-level sections and `### N.M …` subsections in the standards doc.
const sectionMajors = new Set<string>(); // "0".."7"
const sectionSubheadings = new Set<string>(); // "2.8", "4.7", …
for (const line of engineeringLines) {
  const match = line.match(/^(#{2,3})\s+(\d+)(?:\.(\d+))?[a-z]?[.:]?\s/);
  if (!match) continue;
  const [, hashes, major, minor] = match;
  if (hashes === '##') sectionMajors.add(major);
  if (minor !== undefined) sectionSubheadings.add(`${major}.${minor}`);
}

// §6 (the regression ratchet) is an ordered list, not `### 6.N` subsections, so
// "§6.13" / "item 13" resolve against the list's item numbers, not headings.
const ratchetItems = new Set<number>();
{
  let insideSectionSix = false;
  for (const line of engineeringLines) {
    if (/^## 6\. /.test(line)) insideSectionSix = true;
    else if (/^## \d+\. /.test(line)) insideSectionSix = false;
    else if (insideSectionSix) {
      const item = line.match(/^(\d+)\.\s/); // column-0 only → top-level items
      if (item) ratchetItems.add(Number(item[1]));
    }
  }
}

// CLAUDE.md critical constraints are `### N. …` headings.
const constraintNumbers = new Set<number>();
for (const line of claudeLines) {
  const match = line.match(/^###\s+(\d+)\.\s/);
  if (match) constraintNumbers.add(Number(match[1]));
}

// ── Reference collection ─────────────────────────────────────────────────────

interface Reference {
  file: string;
  line: number;
  raw: string;
  major: number;
  minor?: number;
}

function collectSectionRefs(file: string, text: string): Reference[] {
  const refs: Reference[] = [];
  text.split('\n').forEach((line, index) => {
    for (const m of line.matchAll(/§\s?(\d+)(?:\.(\d+)[a-z]?)?/g)) {
      refs.push({
        file,
        line: index + 1,
        raw: m[0],
        major: Number(m[1]),
        minor: m[2] === undefined ? undefined : Number(m[2]),
      });
    }
  });
  return refs;
}

interface NumberedRef {
  file: string;
  line: number;
  raw: string;
  n: number;
}

function collectMatches(file: string, text: string, pattern: RegExp): NumberedRef[] {
  const refs: NumberedRef[] = [];
  text.split('\n').forEach((line, index) => {
    for (const m of line.matchAll(pattern)) {
      refs.push({ file, line: index + 1, raw: m[0], n: Number(m[1]) });
    }
  });
  return refs;
}

const sectionRefs = [
  ...collectSectionRefs(ENGINEERING, engineeringText),
  ...collectSectionRefs(CLAUDE, claudeText),
];

// "constraint #17" and the "CLAUDE.md #17" shorthand — but NOT bare "#418"
// (a React error code) or "next.js#86785" (a GitHub issue), which are not
// constraint references.
const constraintRefs = [
  ...collectMatches(ENGINEERING, engineeringText, /(?:constraint #|CLAUDE\.md #)(\d+)/g),
  ...collectMatches(CLAUDE, claudeText, /(?:constraint #|CLAUDE\.md #)(\d+)/g),
];

// "item 13" / "§6 item 13" — the regression-ratchet list items, which only
// live in the standards doc.
const ratchetItemRefs = collectMatches(ENGINEERING, engineeringText, /\bitem (\d+)\b/g);

// ── Guard the guard: a parsing bug that finds nothing must not pass silently
// (ratchet §6 item 8 — a test that cannot fail is worse than no test). ────────

describe('docs-cross-reference-contract — parsing found real structure', () => {
  it('parsed the expected shape of both documents', () => {
    expect(sectionMajors.size, 'top-level §N sections').toBeGreaterThanOrEqual(7);
    expect(sectionSubheadings.size, '§N.M subsections').toBeGreaterThanOrEqual(20);
    expect(ratchetItems.size, '§6 ratchet items').toBeGreaterThanOrEqual(15);
    expect(constraintNumbers.size, 'CLAUDE.md constraints').toBeGreaterThanOrEqual(15);
    // The references themselves must be found, or every assertion below is vacuous.
    expect(sectionRefs.length, '§ references').toBeGreaterThanOrEqual(20);
    expect(constraintRefs.length, 'constraint references').toBeGreaterThanOrEqual(3);
    expect(ratchetItemRefs.length, 'ratchet item references').toBeGreaterThanOrEqual(5);
  });
});

// ── The integrity assertions ─────────────────────────────────────────────────

describe('docs-cross-reference-contract — every internal reference resolves', () => {
  it('every §N / §N.M reference points to a real section', () => {
    const unresolved: string[] = [];
    for (const ref of sectionRefs) {
      const where = `${ref.file}:${ref.line} "${ref.raw}"`;
      if (ref.minor === undefined) {
        if (!sectionMajors.has(String(ref.major))) {
          unresolved.push(`${where} → no "## ${ref.major}." section`);
        }
      } else if (ref.major === 6) {
        // §6 has no ### subsections; §6.N addresses ratchet list item N.
        if (!ratchetItems.has(ref.minor)) {
          unresolved.push(`${where} → §6 has no ratchet item ${ref.minor}`);
        }
      } else if (!sectionSubheadings.has(`${ref.major}.${ref.minor}`)) {
        unresolved.push(`${where} → no "### ${ref.major}.${ref.minor}" subsection`);
      }
    }
    expect(
      unresolved,
      `unresolved section references — restore the section number or fix the reference:\n${unresolved.join('\n')}`,
    ).toEqual([]);
  });

  it('every "constraint #N" / "CLAUDE.md #N" reference points to a real constraint', () => {
    const unresolved = constraintRefs
      .filter((ref) => !constraintNumbers.has(ref.n))
      .map((ref) => `${ref.file}:${ref.line} "${ref.raw}" → no CLAUDE.md constraint #${ref.n}`);
    expect(
      unresolved,
      `unresolved constraint references — restore the constraint number or fix the reference:\n${unresolved.join('\n')}`,
    ).toEqual([]);
  });

  it('every "item N" reference points to a real §6 ratchet item', () => {
    const unresolved = ratchetItemRefs
      .filter((ref) => !ratchetItems.has(ref.n))
      .map((ref) => `${ref.file}:${ref.line} "${ref.raw}" → §6 has no ratchet item ${ref.n}`);
    expect(
      unresolved,
      `unresolved ratchet-item references — restore the item number or fix the reference:\n${unresolved.join('\n')}`,
    ).toEqual([]);
  });
});
