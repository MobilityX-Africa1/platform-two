import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // TypeScript files (see tsconfig.json): typescript-eslint's rules on top,
    // with type errors themselves left to `npm run typecheck`.
    files: ['frontend/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
  {
    // Vercel serverless functions and their helpers, plus the Vite dev
    // server config, run in Node, not the browser.
    files: ['backend/**/*.js', 'api/**/*.js', 'frontend/vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
