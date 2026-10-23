import { fileURLToPath, URL } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.mjs';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // Skip CSS processing: specs don't need styles
      css: false,
      include: ['src/**/*.spec.js'],
      // the specs run with the Vue 3 behaviours, as the app
      setupFiles: ['src/js/vue-compat-mode.js'],
      // some specs import OpenLayers, Font Awesome or ESLint inside a test: when the whole suite runs in parallel,
      // that first import alone takes up to ~15s (vs < 1s alone), well over the default 5s
      testTimeout: 60000,
      // @vue/test-utils must run on the app's Vue (@vue/compat, aliased as vue): processed by vite, as an ES module.
      // Left in node_modules, its CommonJS build requires the plain vue: a second Vue, where components never update
      server: { deps: { inline: [/@vue\/test-utils/] } },
      alias: [
        {
          find: /^@vue\/test-utils$/,
          replacement: fileURLToPath(
            new URL('./node_modules/@vue/test-utils/dist/vue-test-utils.esm-bundler.mjs', import.meta.url)
          ),
        },
      ],
    },
  })
);
