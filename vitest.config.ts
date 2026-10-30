import { fileURLToPath, URL } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // Skip CSS processing: specs don't need styles
      css: false,
      include: ['src/**/*.spec.{js,ts}'],
      // some specs import OpenLayers, Font Awesome or ESLint inside a test: when the whole suite runs in parallel,
      // that first import alone takes up to ~15s (vs < 1s alone), well over the default 5s
      testTimeout: 60000,
      // @vue/test-utils must run on the same Vue as the specs: processed by vite, as an ES module. Left in
      // node_modules, its CommonJS build requires vue's CommonJS build: a second Vue, where components never update
      server: { deps: { inline: [/@vue\/test-utils/] } },
      alias: [
        // the specs mount components with template strings: the full build of Vue, with the template compiler (the
        // app is compiled ahead of time and uses the runtime only)
        { find: /^vue$/, replacement: 'vue/dist/vue.esm-bundler.js' },
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
