import type { App } from 'vue';

import utils from '@/js/utils';

// Text helpers for templates, as $filters.xxx(value): Vue 3 has no filters (`value | filter`), and recommends
// this global property instead. https://v3-migration.vuejs.org/breaking-changes/filters.html

// CSS ::first-letter does not work on all browsers
export const uppercaseFirstLetter = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// A very basic (a.k.a not bullet-proof) way to remove markdown content from summary
export const stripMarkdown = (value: string): string => utils.stripMarkdown(value);

const filters = { uppercaseFirstLetter, stripMarkdown };

declare module 'vue' {
  interface ComponentCustomProperties {
    $filters: typeof filters;
  }
}

export default function install(app: App) {
  app.config.globalProperties.$filters = filters;
}
