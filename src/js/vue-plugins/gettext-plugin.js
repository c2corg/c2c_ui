import french_translations from '@/translations/fr.json';

const TEXT_NODE = 3;

function cleanMessageId(msgid) {
  if (!msgid) {
    return msgid;
  }

  if (!msgid.replace) {
    // eslint-disable-next-line
    // console.error("Found a non-string in translations", msgid)
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

function getTranslation(messages, msgid, msgctxt) {
  //, n = 1, context = null, defaultPlural = null){
  if (messages === undefined) {
    // `messages are not yet available`
    return msgid;
  }

  const message = messages[msgid];

  if (message === undefined) {
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

function getMessages(lang) {
  if (lang === 'fr') {
    // include fr langage in app
    // and lazy load the others
    return french_translations;
  } else if (lang === 'en') {
    return import(/* webpackChunkName: "translations-en" */ `@/translations/en.json`);
  } else if (lang === 'ca') {
    return import(/* webpackChunkName: "translations-ca" */ `@/translations/ca.json`);
  } else if (lang === 'eu') {
    return import(/* webpackChunkName: "translations-eu" */ `@/translations/eu.json`);
  } else if (lang === 'it') {
    return import(/* webpackChunkName: "translations-it" */ `@/translations/it.json`);
  } else if (lang === 'de') {
    return import(/* webpackChunkName: "translations-de" */ `@/translations/de.json`);
  } else if (lang === 'es') {
    return import(/* webpackChunkName: "translations-es" */ `@/translations/es.json`);
  } else if (lang === 'zh_CN') {
    return import(/* webpackChunkName: "translations-es" */ `@/translations/zh_CN.json`);
  }

  throw new Error(`Unsuported language : ${lang}`);
}

export default function install(Vue) {
  const languageVm = new Vue({
    name: 'Language',

    data: {
      current: null,
    },

    created() {
      // Non-reactive data.
      this.availableUI = {
        fr: 'Français',
        it: 'Italiano',
        de: 'Deutsch',
        en: 'English',
        es: 'Español',
        ca: 'Català',
        eu: 'Euskara',
        zh_CN: 'Chinese',
      };

      this.availableAPI = {
        fr: 'Français',
        it: 'Italiano',
        de: 'Deutsch',
        en: 'English',
        es: 'Español',
        ca: 'Català',
        eu: 'Euskara',
        zh: 'Chinese',
      };

      this.translations = {};
      this.current = this.$localStorage.get('current', 'fr');
    },

    methods: {
      firstLoad() {
        const lang = this.current;

        this._getMessages(this.current).then(() => {
          // dirty : simulate lang update to fire the update of page on load
          this.current = null;
          this.current = lang;
          // set html lang attribute
          document.documentElement.setAttribute('lang', lang);
        });
      },

      setCurrent(lang) {
        // save in locale storage
        this.$localStorage.set('current', lang);

        // if user is logged, we need to save in db his preference
        this.$user.saveLangPreference(lang);

        // then, we must defer lang setter
        // because we may need to lazy load data
        this._getMessages(lang).then(() => {
          this.current = lang;
          // set html lang attribute
          document.documentElement.setAttribute('lang', this.getIANALanguageSubtag(lang));
        });
      },

      _getMessages(lang) {
        // TODO : normally, webpack should handle this
        if (this.translations[lang] !== undefined) {
          return new Promise((resolve) => {
            resolve(this.translations[lang]);
          });
        }

        const messages = getMessages(lang);

        return new Promise((resolve) => {
          if (messages.then) {
            // messages is a promise
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
        return getTranslation(this.translations[this.current], msgid, msgctxt)
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
            return lang;
          case 'zh_CN':
            return 'zh';
          default:
            // eslint-disable-next-line no-console
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
          case 'zh':
            return 'zh_CN';
          case 'zh_CN':
            return 'zh_CN';
          default:
            // eslint-disable-next-line no-console
            console.error(`Unexpected language: ${lang}`);
            return lang;
        }
      },

      updateElement(element) {
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

        element.innerText = this.gettext(element.dataset.msgid, element.dataset.msgctxt);
      },
    },
  });

  // An option to support translation with HTML content: `v-translate`.
  Vue.directive('translate', {
    bind(el) {
      // console.log("bind", el)
      languageVm.updateElement(el);
    },
    inserted(el) {
      // console.log("inserted", el)
      languageVm.updateElement(el);
    },
    update(el) {
      // console.log("update", el)
      languageVm.updateElement(el);
    },
  });

  Vue.prototype.$language = languageVm;
  Vue.prototype.$gettext = languageVm.gettext.bind(languageVm);
}
