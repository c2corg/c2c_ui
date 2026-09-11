import { reactive } from 'vue';

import { getNamedLocalStorageItem } from '@/js/vue-plugins/local-storage';
import french_translations from '@/translations/fr.json';

/** @typedef {'ca' | 'es' | 'eu' | 'de' | 'fr' | 'hu' | 'it' | 'sl' | 'zh_CN' | 'en'} Lang */

const TEXT_NODE = 3;

/**
 * @param {string | undefined} msgid
 * @returns {string}
 */
function cleanMessageId(msgid) {
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

/**
 * @param {{ [msgid: string]: string | { [ctxt: string]: string } } | undefined} messages
 * @param {string} msgid
 * @param {string} msgctxt
 * @returns {string}
 */
function getTranslation(messages, msgid, msgctxt) {
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
  if (!!msgctxt) {
    return message[msgctxt] ?? msgid;
  }

  // if context isn't provided, message may be a string if this msgid hasn't other version with context
  if (typeof message === 'string') {
    return message;
  }

  // otherwise, it's stored in '$$noContext' key
  // note that '$$noContext' is a reserved context :)
  return message['$$noContext'] ?? msgid;
}

/**
 * @param {Lang} lang
 * @returns
 */
function getMessages(lang) {
  if (lang === 'fr') {
    // include fr langage in app
    // and lazy load the others
    return french_translations;
  } else if (lang === 'en') {
    return import(`@/translations/en.json`);
  } else if (lang === 'ca') {
    return import(`@/translations/ca.json`);
  } else if (lang === 'eu') {
    return import(`@/translations/eu.json`);
  } else if (lang === 'it') {
    return import(`@/translations/it.json`);
  } else if (lang === 'de') {
    return import(`@/translations/de.json`);
  } else if (lang === 'es') {
    return import(`@/translations/es.json`);
  } else if (lang === 'hu') {
    return import(`@/translations/hu.json`);
  } else if (lang === 'zh_CN') {
    return import(`@/translations/zh_CN.json`);
  } else if (lang === 'sl') {
    return import(`@/translations/sl.json`);
  }

  throw new Error(`Unsuported language : ${lang}`);
}

export default function install(app) {
  // cross-plugin globals are looked up lazily (not captured at install time),
  // because plugin install order matters (this plugin is installed before the user one).
  const globals = app.config.globalProperties;
  const storage = getNamedLocalStorageItem('Language');

  const language = reactive({
    current: storage.get('current', 'fr'),

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
  });

  language.firstLoad = function () {
    const lang = language.current;

    language._getMessages(language.current).then(() => {
      // dirty : simulate lang update to fire the update of page on load
      language.current = null;
      language.current = lang;
      // set html lang attribute
      document.documentElement.setAttribute('lang', lang);
    });
  };

  /** @param {Lang} lang */
  language.setCurrent = function (lang) {
    // save in locale storage
    storage.set('current', lang);

    // if user is logged, we need to save in db his preference
    globals.$user.saveLangPreference(lang);

    // then, we must defer lang setter
    // because we may need to lazy load data
    language._getMessages(lang).then(() => {
      language.current = lang;
      // set html lang attribute
      document.documentElement.setAttribute('lang', language.getIANALanguageSubtag(lang));
    });
  };

  language._getMessages = function (lang) {
    if (language.translations[lang] !== undefined) {
      return new Promise((resolve) => {
        resolve(language.translations[lang]);
      });
    }

    const messages = getMessages(lang);

    return new Promise((resolve) => {
      if (messages.then) {
        // messages is a promise
        messages.then((translations) => {
          language.translations[lang] = translations[lang];
          resolve(translations[lang]);
        });
      } else {
        language.translations[lang] = messages[lang];
        resolve(messages[lang]);
      }
    });
  };

  /**
   * @param {string} msgid
   * @param {string} msgctxt
   * @returns {string}
   */
  language.gettext = function (msgid, msgctxt) {
    return getTranslation(language.translations[language.current], msgid, msgctxt)
      .replace(/&quot;/g, '"')
      .replace(/&#x5C;/gi, '\\');
  };

  /**
   * @param {Lang} lang
   * @returns {string}
   */
  language.getIANALanguageSubtag = function (lang) {
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
        // eslint-disable-next-line no-console
        console.error(`Unexpected language: ${lang}`);
        return lang;
    }
  };

  /**
   * @param {Lang} lang
   * @returns {string}
   */
  language.getIsoLanguageTerritory = function (lang) {
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
        // eslint-disable-next-line no-console
        console.error(`Unexpected language: ${lang}`);
        return lang;
    }
  };

  /** @param {HTMLElement} element */
  language.updateElement = function (element) {
    if (element.dataset.msgid === undefined) {
      if (element.childNodes.length > 1 || element.firstChild.nodeType !== TEXT_NODE) {
        // eslint-disable-next-line
        console.error('v-translate must contains only text', element.childNodes);
        return;
      }

      element.dataset.msgid = cleanMessageId(element.innerText);

      const context = element.attributes.getNamedItem('translate-context');
      if (context) {
        element.dataset.msgctxt = context.value;
      }
    }

    element.innerText = language.gettext(element.dataset.msgid, element.dataset.msgctxt);
  };

  // An option to support translation with HTML content: `v-translate`.
  app.directive('translate', {
    /** @param {HTMLElement} el */
    beforeMount(el) {
      language.updateElement(el);
    },
    /** @param {HTMLElement} el */
    mounted(el) {
      language.updateElement(el);
    },
    /** @param {HTMLElement} el */
    updated(el) {
      language.updateElement(el);
    },
  });

  app.config.globalProperties.$language = language;
  app.config.globalProperties.$gettext = language.gettext;
}
