import { fileURLToPath, URL } from 'node:url';

import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createNodeResolver, flatConfigs as importX } from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['node_modules/', 'dist/', 'src/assets/font-awesome-custom/'] },

  // Vue 3 rules: the deprecated Vue 2 syntax is an error
  ...pluginVue.configs['flat/recommended'],
  importX.errors,
  importX.warnings,
  // TypeScript: its own parser and recommended rules, for the .ts files only (the JavaScript code is not typed yet)
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.ts'] })),
  eslintPluginPrettier,
  eslintConfigPrettier,

  {
    files: ['**/*.{js,mjs,ts,vue}'],
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: {
      // in components, <script lang="ts"> read by typescript-eslint's parser, the others by ESLint's; set for every file,
      // as import-x reads the imported components with the parser options of the importing file
      parserOptions: { parser: { ts: tseslint.parser, js: 'espree' } },
      globals: {
        ...globals.browser,
        // replaced at build time (vite.config.ts define)
        CAMPTOCAMP_CONFIG: 'readonly',
      },
    },
    settings: {
      'import-x/extensions': ['.js', '.mjs', '.ts', '.vue'],
      // to read the exports of the imported components and TypeScript modules
      'import-x/parsers': { 'vue-eslint-parser': ['.vue'], '@typescript-eslint/parser': ['.ts'] },
      // a component's only export is its default one, which Vue's compiler generates for <script setup>, unseen by import-x
      'import-x/ignore': ['\\.vue$'],
      'import-x/resolver-next': [
        createNodeResolver({
          extensions: ['.js', '.ts', '.vue', '.json'],
          alias: { '@': [fileURLToPath(new URL('./src', import.meta.url))] },
        }),
      ],
    },
    rules: {
      'prettier/prettier': ['warn', { endOfLine: 'auto' }],
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      // console.warn and console.error report the failures to the developers
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'vue/no-v-html': 'off',
      'vue/order-in-components': 'warn',
      'vue/require-prop-types': 'warn',
      'vue/require-default-prop': 'warn',
      'vue/attributes-order': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-mutating-props': 'off',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/prop-name-casing': ['error', 'camelCase'],
      eqeqeq: 'warn',
      camelcase: 'off',
      // new in import-x's warnings, not in eslint-plugin-import's: components are imported under other names
      'import-x/no-rename-default': 'off',
      'import-x/order': [
        'error',
        { 'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: false } },
      ],
    },
  },

  // TypeScript checks undefined names and unused variables itself, with types
  {
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },

  // in components, the core rule reads the parameter names of the function types of <script lang="ts"> as unused variables
  {
    files: ['**/*.vue'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // run by Node (the specs by Vitest)
  {
    files: ['*.ts', 'tools/**/*.ts', 'src/**/*.spec.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Playwright: run by Node, with code run in the page (page.evaluate, addInitScript)
  {
    files: ['e2e/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  // the specs and their helpers declare small stub components inline
  {
    files: ['src/**/*.spec.{js,ts}', 'src/views/wiki/edition/edition-test-utils.ts'],
    rules: {
      'vue/one-component-per-file': 'off',
      'vue/require-prop-types': 'off',
      'vue/order-in-components': 'off',
    },
  },

  {
    files: ['*.config.ts', 'src/**/*.spec.{js,ts}'],
    rules: {
      'import-x/no-unresolved': ['error', { ignore: ['^vitest(/|$)', '^@vitejs/plugin-legacy$'] }],
    },
  },
];
