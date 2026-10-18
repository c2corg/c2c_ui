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
    },
  })
);
