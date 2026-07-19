import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import noSplitMapFilter from './scripts/eslint-rules/no-split-map-filter.mjs';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'off',
      'react/jsx-no-target-blank': 'off',
      // eslint-plugin-react@7.37.5 (latest — required by the dependency-freshness
      // contract) crashes under eslint@10's flat-config rule context for any rule
      // that calls its shared React-version-detection utility. These are the only
      // rules in this config that hit that path; everything else (jsx-key,
      // no-unknown-property, prop-types, etc.) works fine. Revert once
      // eslint-plugin-react ships a fix — see https://github.com/jsx-eslint/eslint-plugin-react/issues
      'react/display-name': 'off',
      'react/no-direct-mutation-state': 'off',
      'react/no-render-return-value': 'off',
      'react/no-string-refs': 'off',
      'react/require-render-return': 'off'
    }
  },
  {
    // Algorithm & data-structure standards (see CLAUDE.md) enforced at the AST
    // level for all production source. The contract tests verify the known hot
    // spots behaviorally; these rules stop new violations at lint time.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    plugins: {
      local: { rules: { 'no-split-map-filter': noSplitMapFilter } }
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='filter'][callee.object.type='CallExpression'][callee.object.callee.property.name='map']",
          message:
            'map().filter() allocates an intermediate array — use a single-pass for loop with conditional push (CLAUDE.md algorithm standards).'
        },
        {
          selector:
            "CallExpression[callee.property.name='filter'][callee.object.type='CallExpression'][callee.object.callee.property.name='flatMap']",
          message:
            'flatMap().filter() allocates an intermediate array — use a single-pass loop (CLAUDE.md algorithm standards).'
        },
        {
          selector: "CallExpression[callee.property.name='reduce'] SpreadElement",
          message:
            'Spreading inside a reduce() callback is O(n²) — mutate the accumulator or use a loop.'
        }
      ],
      // A single-selector AST rule only matches one fixed shape
      // (`a.map(f).filter(g)`) — splitting the same allocation across two
      // statements (`const m = a.map(f); m.filter(g)`) evades it while doing
      // the identical work. This rule uses real scope analysis to catch that
      // split form too (scripts/eslint-rules/no-split-map-filter.mjs).
      'local/no-split-map-filter': 'error'
    }
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'node_modules/**',
    'coverage/**',
    '.stryker-tmp/**',
    'reports/**',
    // Cloudflare's generated dev-server scaffold (wrangler pages dev) —
    // already gitignored; missing here meant a local `wrangler pages dev`
    // run left lintable-looking generated JS under .wrangler/tmp/ that
    // could fail `pnpm run lint`'s zero-warning gate for reasons that have
    // nothing to do with this repo's own source.
    '.wrangler/**'
  ])
]);
