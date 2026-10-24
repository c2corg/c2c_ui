import { fileURLToPath, URL } from 'node:url';

import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createNodeResolver, flatConfigs as importX } from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'dist/', 'tools/', 'src/assets/font-awesome-custom/'] },

  // Vue 3 rules: the deprecated Vue 2 syntax is an error
  ...pluginVue.configs['flat/recommended'],
  importX.errors,
  importX.warnings,
  eslintPluginPrettier,
  eslintConfigPrettier,

  {
    files: ['**/*.{js,mjs,vue}'],
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: {
      globals: {
        ...globals.browser,
        // replaced at build time (vite.config.mjs define)
        CAMPTOCAMP_CONFIG: 'readonly',
      },
    },
    settings: {
      'import-x/extensions': ['.js', '.mjs', '.vue'],
      // to read the exports of the imported components
      'import-x/parsers': { 'vue-eslint-parser': ['.vue'] },
      'import-x/resolver-next': [
        createNodeResolver({
          extensions: ['.js', '.vue', '.json'],
          alias: { '@': [fileURLToPath(new URL('./src', import.meta.url))] },
        }),
      ],
    },
    rules: {
      'prettier/prettier': ['warn', { endOfLine: 'auto' }],
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'warn',
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

  // run by Node (the specs by Vitest)
  {
    files: ['*.mjs', 'src/**/*.spec.js'],
    languageOptions: { globals: globals.node },
  },

  // Playwright: run by Node, with code run in the page (page.evaluate, addInitScript)
  {
    files: ['e2e/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  {
    files: ['vite.config.mjs', 'vitest.config.mjs', 'eslint.config.mjs', 'src/**/*.spec.js'],
    rules: {
      'import-x/no-unresolved': ['error', { ignore: ['^vitest(/|$)', '^@vitejs/plugin-legacy$'] }],
    },
  },
];
