import type { App } from 'vue';

import { formatLength, formatNumber } from '@/js/length-format';
import utils from '@/js/utils';

// Text helpers for templates, as $filters.xxx(value): Vue 3 has no filters (`value | filter`), and recommends
// this global property instead. https://v3-migration.vuejs.org/breaking-changes/filters.html

// CSS ::first-letter does not work on all browsers
export const uppercaseFirstLetter = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// A very basic (a.k.a not bullet-proof) way to remove markdown content from summary
export const stripMarkdown = (value: string): string => utils.stripMarkdown(value);

// The number formats of the UI language ($language, installed after this plugin: read when called)
const numberFilters = (app: App) => {
  const lang = () => app.config.globalProperties.$language?.current;

  return {
    // an elevation, a height difference...: 4 808 (fr), 4,808 (en), 4.808 (de)
    number: (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, lang(), options),
    // a length in metres, with its unit: 560 m, 4,5 km, 12 km
    length: (metres: number) => {
      const { value, unit } = formatLength(metres, lang());
      return `${value}\u00a0${unit}`;
    },
  };
};

type Filters = { uppercaseFirstLetter: typeof uppercaseFirstLetter; stripMarkdown: typeof stripMarkdown } & ReturnType<
  typeof numberFilters
>;

declare module 'vue' {
  interface ComponentCustomProperties {
    $filters: Filters;
  }
}

export default function install(app: App) {
  app.config.globalProperties.$filters = { uppercaseFirstLetter, stripMarkdown, ...numberFilters(app) };
}
