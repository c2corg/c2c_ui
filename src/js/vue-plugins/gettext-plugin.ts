import type { App } from 'vue';

import { type Language, type Lang, type Messages, useLanguageStore } from '@/stores/language';

export type { Language, Lang, Messages };

declare module 'vue' {
  interface ComponentCustomProperties {
    $language: Language;
    $gettext: Language['gettext'];
  }
}

// the language store, as $language and $gettext for the components (after Pinia), and the v-translate directive
export default function install(app: App) {
  const language = app.runWithContext(() => useLanguageStore());

  // An option to support translation with HTML content: `v-translate`.
  // The elements are translated again when the language changes: in Vue 3, a directive is updated only when its
  // component renders again, which a slot content (in <router-link>, <login-button>...) doesn't do
  const translatedElements = new Set<HTMLElement>();
  language.onChange(() => translatedElements.forEach((element) => language.updateElement(element)));

  app.directive<HTMLElement>('translate', {
    beforeMount(el) {
      language.updateElement(el);
      translatedElements.add(el);
    },
    updated(el) {
      language.updateElement(el);
    },
    unmounted(el) {
      translatedElements.delete(el);
    },
  });

  app.config.globalProperties.$language = language;
  // bound to the store: a Pinia action reads this.$id, which on a component (this.$gettext()) is a missing property
  // Vue warns about in development
  app.config.globalProperties.$gettext = language.gettext.bind(language);
}
