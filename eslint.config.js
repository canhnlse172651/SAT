import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist', '**/coverage', '.sdd', '.claude', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    extends: [js.configs.recommended],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/api/**/*.ts', 'scripts/**', 'tests/**', 'specs/*/testing/**', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    // Static helpers loaded by the spec pages (specs/*/spec.html) run in the browser.
    files: ['specs/assets/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    // Nest DI needs value imports for constructor-injected classes; with these options
    // consistent-type-imports leaves decorated files alone instead of breaking the metadata.
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      parserOptions: { emitDecoratorMetadata: true, experimentalDecorators: true },
    },
  },
]);
