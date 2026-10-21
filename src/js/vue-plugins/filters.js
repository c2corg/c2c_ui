import utils from '@/js/utils';

// Text helpers for templates, as $filters.xxx(value): Vue 3 has no filters (`value | filter`), and recommends
// this global property instead. https://v3-migration.vuejs.org/breaking-changes/filters.html

// CSS ::first-letter does not work on all browsers
export const uppercaseFirstLetter = (value) => value.charAt(0).toUpperCase() + value.slice(1);

// A very basic (a.k.a not bullet-proof) way to remove markdown content from summary
export const stripMarkdown = (value) => utils.stripMarkdown(value);

export default function install(app) {
  app.config.globalProperties.$filters = { uppercaseFirstLetter, stripMarkdown };
}
