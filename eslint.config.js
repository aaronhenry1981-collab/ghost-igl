import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist = build output. desktop/ is the parked Electron stub (CommonJS,
  // Node globals — the real desktop app lives in its own repo). aws/ holds
  // CloudFront Functions (their runtime REQUIRES a top-level `handler` that
  // is "never used" from the file's point of view). Linting those with
  // browser-ESM rules produces only false positives.
  globalIgnores(['dist', 'desktop', 'aws']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  // Fast-refresh purity doesn't apply to these:
  //  - main.jsx is the entry point (route table + layout wrappers); it is
  //    never hot-swapped as a component module.
  //  - hooks/ files export a hook plus its context/provider component — the
  //    standard React context pattern. Splitting each into two files buys
  //    nothing but churn.
  {
    files: ['src/main.jsx', 'src/hooks/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
