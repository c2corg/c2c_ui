import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue2';
import { defineConfig } from 'vitest/config';

// Unit tests only: the application is still built by Vue CLI (see vue.config.js).
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // Skip CSS processing, so the global Sass additionalData from vue.config.js is not needed
    css: false,
    include: ['src/**/*.spec.js'],
  },
});
