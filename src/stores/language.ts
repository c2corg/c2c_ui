// The language of the UI: the current one, kept in the local storage of the browser, and its translations
import { defineStore } from 'pinia';
import { computed, markRaw, reactive, watch } from 'vue';

import { getPreferences } from '@/js/vue-plugins/local-storage';
import { useUserStore } from '@/stores/user';
import french_translations from '@/translations/fr.json';

export type Lang = 'ca' | 'es' | 'eu' | 'de' | 'fr' | 'hu' | 'it' | 'sl' | 'zh_CN' | 'en';

// the messages of a language: per msgid, its translation, or its translations per context ('$$noContext': none)
export type Messages = Record<string, string | Record<string, string>>;

const TEXT_NODE = 3;

function cleanMessageId(msgid: string): string {
  if (!msgid) {
    return msgid;
  }

  if (!msgid.replace) {
    return String(msgid);
  }

  return (
    msgid
      .trim()
      .replace(/"/g, '&quot;')
      .replace(/\\/g, '&#x5C;')
      // remove new lines and duplicated spaces
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
  );
}

function getTranslation(messages: Messages | undefined, msgid: string, msgctxt?: string): string {
  //, n = 1, context = null, defaultPlural = null){
  if (!messages) {
    // `messages are not yet available`
    return msgid;
  }

  const message = messages[msgid];

  if (!message) {
    return msgid;
  }

  // message can be a key-value object, if a context exists for this msgid
  if (msgctxt) {
    return (message as Record<string, string>)[msgctxt] ?? msgid;
  }

  // if context isn't provided, message may be a string if this msgid hasn't other version with context
  if (typeof message === 'string') {
    return message;
  }

  // otherwise, it's stored in '$$noContext' key
  // note that '$$noContext' is a reserved context :)
  return message['$$noContext'] ?? msgid;
}

// a translations file: { <lang>: messages }; French is bundled, the others are loaded when chosen
type TranslationsFile = Record<string, Messages>;

// the module of a translations file, whose language key is read as a named export
const load = (file: Promise<unknown>) => file as Promise<TranslationsFile>;

function getMessages(lang: string): TranslationsFile | Promise<TranslationsFile> {
  if (lang === 'fr') {
    // include fr langage in app
    // and lazy load the others
    return french_translations as TranslationsFile;
  } else if (lang === 'en') {
    return load(import(`@/translations/en.json`));
  } else if (lang === 'ca') {
    return load(import(`@/translations/ca.json`));
  } else if (lang === 'eu') {
    return load(import(`@/translations/eu.json`));
  } else if (lang === 'it') {
    return load(import(`@/translations/it.json`));
  } else if (lang === 'de') {
    return load(import(`@/translations/de.json`));
  } else if (lang === 'es') {
    return load(import(`@/translations/es.json`));
  } else if (lang === 'hu') {
    return load(import(`@/translations/hu.json`));
  } else if (lang === 'zh_CN') {
    return load(import(`@/translations/zh_CN.json`));
  } else if (lang === 'sl') {
    return load(import(`@/translations/sl.json`));
  }

  throw new Error(`Unsuported language : ${lang}`);
}

export const useLanguageStore = defineStore('language', () => {
  // stored under the name of the former Language component, so that the chosen language is kept
  const preferences = getPreferences('Language');
  // only the current language is reactive: translations are big, and read through it. A reactive object, not a ref:
  // firstLoad() sets the same language again once its messages are loaded, which must update the page
  const state = reactive<{ current: string | null }>({ current: preferences.get<string>('current', 'fr') });

  // a Lang; null only while firstLoad() fires the update of the page
  const current = computed({
    get: () => state.current,
    set: (lang: string | null) => {
      state.current = lang;
    },
  });

  const translations: Partial<Record<string, Messages>> = markRaw({});

  const availableUI: Record<string, string> = {
    fr: 'Français',
    it: 'Italiano',
    de: 'Deutsch',
    en: 'English',
    es: 'Español',
    ca: 'Català',
    eu: 'Euskara',
    hu: 'Magyar',
    zh_CN: '简体中文',
    sl: 'Slovenščina',
  };

  const availableAPI: Record<string, string> = {
    fr: 'Français',
    it: 'Italiano',
    de: 'Deutsch',
    en: 'English',
    es: 'Español',
    ca: 'Català',
    eu: 'Euskara',
    zh: '简体中文',
    sl: 'Slovenščina',
  };

  function firstLoad() {
    const lang = current.value as string;

    _getMessages(lang).then(() => {
      // dirty : simulate lang update to fire the update of page on load
      current.value = null;
      current.value = lang;
      // set html lang attribute
      document.documentElement.setAttribute('lang', lang);
    });
  }

  function setCurrent(lang: string) {
    // save in locale storage
    preferences.set('current', lang);

    // if user is logged, we need to save in db his preference
    useUserStore().saveLangPreference(lang);

    // then, we must defer lang setter
    // because we may need to lazy load data
    _getMessages(lang).then(() => {
      current.value = lang;
      // set html lang attribute
      document.documentElement.setAttribute('lang', getIANALanguageSubtag(lang));
    });
  }

  function _getMessages(lang: string): Promise<Messages> {
    // TODO : normally, the bundler should handle this
    if (translations[lang] !== undefined) {
      return new Promise((resolve) => {
        resolve(translations[lang] as Messages);
      });
    }

    const messages = getMessages(lang);

    return new Promise((resolve) => {
      if (messages instanceof Promise) {
        messages.then((file) => {
          translations[lang] = file[lang];
          resolve(file[lang]);
        });
      } else {
        translations[lang] = messages[lang];
        resolve(messages[lang]);
      }
    });
  }

  function gettext(msgid: string, msgctxt?: string): string {
    return getTranslation(translations[current.value ?? ''], msgid, msgctxt)
      .replace(/&quot;/g, '"')
      .replace(/&#x5C;/gi, '\\');
  }

  function getIANALanguageSubtag(lang: string): string {
    switch (lang) {
      case 'fr':
      case 'en':
      case 'ca':
      case 'eu':
      case 'it':
      case 'de':
      case 'es':
      case 'zh':
      case 'hu':
      case 'sl':
        return lang;
      case 'zh_CN':
        return 'zh';
      default:
        console.error(`Unexpected language: ${lang}`);
        return lang;
    }
  }

  function getIsoLanguageTerritory(lang: string): string {
    switch (lang) {
      case 'fr':
        return 'fr_FR';
      case 'en':
        return 'en_UK';
      case 'ca':
        return 'ca_ES';
      case 'eu':
        return 'eu_ES';
      case 'it':
        return 'it_IT';
      case 'de':
        return 'de_DE';
      case 'es':
        return 'es_ES';
      case 'hu':
        return 'hu_HU';
      case 'zh':
      case 'zh_CN':
        return 'zh_CN';
      case 'sl':
        return 'sl_SI';
      default:
        console.error(`Unexpected language: ${lang}`);
        return lang;
    }
  }

  function updateElement(element: HTMLElement) {
    // the text to translate, translated in place: on a component, a slot comes between the empty text nodes Vue 3
    // marks fragments with, which must stay
    const nodes = [...element.childNodes].filter((node) => node.nodeType !== TEXT_NODE || node.textContent !== '');
    if (nodes.length !== 1 || nodes[0].nodeType !== TEXT_NODE) {
      console.error('v-translate must contains only text', element.childNodes);
      return;
    }
    const [text] = nodes;

    if (element.dataset.msgid === undefined) {
      element.dataset.msgid = cleanMessageId(text.textContent ?? '');

      const context = element.attributes.getNamedItem('translate-context');
      if (context) {
        element.dataset.msgctxt = context.value;
      }
    }

    text.textContent = gettext(element.dataset.msgid ?? '', element.dataset.msgctxt);
  }

  // calls back on any change of the current language, the same one set again included
  function onChange(callback: () => void) {
    watch(state, callback);
  }

  return {
    availableUI,
    availableAPI,
    translations,
    current,
    firstLoad,
    setCurrent,
    _getMessages,
    gettext,
    getIANALanguageSubtag,
    getIsoLanguageTerritory,
    updateElement,
    onChange,
  };
});

export type Language = ReturnType<typeof useLanguageStore>;
