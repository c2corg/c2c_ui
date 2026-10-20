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
      // some specs import OpenLayers, Font Awesome or ESLint inside a test: when the whole suite runs in parallel,
      // that first import alone takes up to ~15s (vs < 1s alone), well over the default 5s
      testTimeout: 60000,
    },
  })
);
