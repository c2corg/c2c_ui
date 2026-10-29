import { type App, reactive, watch } from 'vue';

import { getPreferences } from './local-storage';

import french_translations from '@/translations/fr.json';

export type Lang = 'ca' | 'es' | 'eu' | 'de' | 'fr' | 'hu' | 'it' | 'sl' | 'zh_CN' | 'en';

// the messages of a language: per msgid, its translation, or its translations per context ('$$noContext': none)
export type Messages = Record<string, string | Record<string, string>>;

export type Language = {
  readonly availableUI: Record<string, string>;
  readonly availableAPI: Record<string, string>;
  translations: Partial<Record<string, Messages>>;
  // a Lang; null only while firstLoad() fires the update of the page
  current: string | null;
  firstLoad(): void;
  setCurrent(lang: string): void;
  _getMessages(lang: string): Promise<Messages>;
  gettext(msgid: string, msgctxt?: string): string;
  getIANALanguageSubtag(lang: string): string;
  getIsoLanguageTerritory(lang: string): string;
  updateElement(element: HTMLElement): void;
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $language: Language;
    $gettext: Language['gettext'];
  }
}

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

export default function install(app: App) {
  // stored under the name of the former Language component, so that the chosen language is kept
  const preferences = getPreferences('Language');
  // only the current language is reactive: translations are big, and read through it
  const state = reactive<{ current: string | null }>({ current: preferences.get<string>('current', 'fr') });

  const language: Language = {
    availableUI: {
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
    },

    availableAPI: {
      fr: 'Français',
      it: 'Italiano',
      de: 'Deutsch',
      en: 'English',
      es: 'Español',
      ca: 'Català',
      eu: 'Euskara',
      zh: '简体中文',
      sl: 'Slovenščina',
    },

    translations: {},

    get current() {
      return state.current;
    },

    set current(lang) {
      state.current = lang;
    },

    firstLoad() {
      const lang = this.current as string;

      this._getMessages(lang).then(() => {
        // dirty : simulate lang update to fire the update of page on load
        this.current = null;
        this.current = lang;
        // set html lang attribute
        document.documentElement.setAttribute('lang', lang);
      });
    },

    setCurrent(lang) {
      // save in locale storage
      preferences.set('current', lang);

      // if user is logged, we need to save in db his preference
      app.config.globalProperties.$user.saveLangPreference(lang);

      // then, we must defer lang setter
      // because we may need to lazy load data
      this._getMessages(lang).then(() => {
        this.current = lang;
        // set html lang attribute
        document.documentElement.setAttribute('lang', this.getIANALanguageSubtag(lang));
      });
    },

    _getMessages(lang) {
      // TODO : normally, the bundler should handle this
      if (this.translations[lang] !== undefined) {
        return new Promise((resolve) => {
          resolve(this.translations[lang] as Messages);
        });
      }

      const messages = getMessages(lang);

      return new Promise((resolve) => {
        if (messages instanceof Promise) {
          messages.then((translations) => {
            this.translations[lang] = translations[lang];
            resolve(translations[lang]);
          });
        } else {
          this.translations[lang] = messages[lang];
          resolve(messages[lang]);
        }
      });
    },

    gettext(msgid, msgctxt) {
      return getTranslation(this.translations[this.current ?? ''], msgid, msgctxt)
        .replace(/&quot;/g, '"')
        .replace(/&#x5C;/gi, '\\');
    },

    getIANALanguageSubtag(lang) {
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
    },

    getIsoLanguageTerritory(lang) {
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
    },

    updateElement(element) {
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

      text.textContent = this.gettext(element.dataset.msgid ?? '', element.dataset.msgctxt);
    },
  };

  // An option to support translation with HTML content: `v-translate`.
  // The elements are translated again when the language changes: in Vue 3, a directive is updated only when its
  // component renders again, which a slot content (in <router-link>, <login-button>...) doesn't do
  const translatedElements = new Set<HTMLElement>();
  // (the state itself, not its value: firstLoad() sets the same language again once its messages are loaded)
  watch(state, () => translatedElements.forEach((element) => language.updateElement(element)));

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
  app.config.globalProperties.$gettext = language.gettext.bind(language);
}
