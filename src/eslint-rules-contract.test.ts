/**
 * Contract for this repo's custom ESLint rules — tooling needs tests too
 * (ENGINEERING-STANDARDS.md §6 item 8: "test infrastructure needs tests of
 * its own"). Verifies scripts/eslint-rules/no-split-map-filter.mjs actually
 * catches the split-statement map/filter evasion it exists to close, and
 * doesn't false-positive on legitimate code.
 */
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
// @ts-expect-error — plain .mjs rule module, no type declarations
import noSplitMapFilter from '../scripts/eslint-rules/no-split-map-filter.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('eslint-rules-contract — no-split-map-filter', () => {
  ruleTester.run('no-split-map-filter', noSplitMapFilter, {
    valid: [
      // A single .filter() with no preceding map/flatMap assignment.
      'const result = items.filter((x) => x.alive);',
      // .filter() on a variable NOT sourced from map/flatMap.
      'const items = getItems(); const result = items.filter((x) => x.alive);',
      // .filter() on a variable reassigned after its map() — outside what
      // this rule can safely infer, so it correctly stays silent (defs.length !== 1).
      'let mapped = items.map((x) => x.value); mapped = otherItems; const result = mapped.filter((x) => x > 0);',
      // A destructured variable — not a direct map()/flatMap() call result.
      'const { mapped } = buildStuff(); const result = mapped.filter((x) => x > 0);',
    ],
    invalid: [
      {
        code: 'const mapped = items.map((x) => x.value); const result = mapped.filter((x) => x > 0);',
        errors: [{ messageId: 'splitMapFilter', data: { sourceMethod: 'map' } }],
      },
      {
        code: 'const mapped = items.flatMap((x) => x.values); const result = mapped.filter((x) => x > 0);',
        errors: [{ messageId: 'splitMapFilter', data: { sourceMethod: 'flatMap' } }],
      },
      {
        // The evasion doesn't require the filter call to be the very next
        // statement — any later reference to the same binding is still the
        // identical two-array allocation.
        code: 'const mapped = items.map((x) => x.value); doSomethingUnrelated(); const result = mapped.filter((x) => x > 0);',
        errors: [{ messageId: 'splitMapFilter', data: { sourceMethod: 'map' } }],
      },
    ],
  });
});
