import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

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
  globalIgnores([
    '.next/**',
    'out/**',
    'node_modules/**',
    'coverage/**'
  ])
]);
