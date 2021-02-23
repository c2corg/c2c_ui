import french_translations from '@/translations/fr.json';

const TEXT_NODE = 3;
const INTERPOLATION_RE = /%\{((?:.|\n)+?)\}/g;

function cleanMessageId(msgid) {
  if (!msgid) {
    return msgid;
  }

  if (!(typeof msgid === 'string' || msgid instanceof string)) {
    // eslint-disable-next-line
    // console.error("Found a non-string in translations", msgid)
    return String(msgid);
  }

  msgid = msgid.trim();
  // remove new lines and duplicated spaces
  msgid = msgid.replace(/\n/g, ' ');
  msgid = msgid.replace(/\s+/g, ' ');

  return msgid;
}

function getTranslationIndex(lang, n) {
  if (lang === 'fr') {
    return n > 1 ? 1 : 0;
  }
  return n !== 1 ? 1 : 0;
}

function interpolate(msgstr, context = {}) {
  msgstr.replace(INTERPOLATION_RE, (match, token) => context[token.trim()] ?? match);
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
      this.available = {
        fr: 'Français',
        it: 'Italiano',
        de: 'Deutsch',
        en: 'English',
        es: 'Español',
        ca: 'Català',
        eu: 'Euskara',
        zh_CN: 'Chinese',
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
          document.documentElement.setAttribute('lang', this.getIANALanguageSubtag(lang));
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
          if (messages instanceof Promise) {
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

      gettext(msgid, msgctxt = null, n = 1, defaultPlural = null) {
        const messages = this.translations[this.current];
        if (messages === undefined) {
          // `messages are not yet available`
          return msgid;
        }

        // Default untranslated string, singular or plural.
        const untranslated = defaultPlural && getTranslationIndex(this.current, n) > 0 ? defaultPlural : msgid;

        let translated = messages[msgid];

        if (!translated) {
          return untranslated;
        }

        // message can be a key-value object, if a context exists for this msgid
        if (!!msgctxt) {
          translated = translated[msgctxt];
        }

        if (!translated) {
          return untranslated;
        }

        // message is a plural form
        let translationIndex = getTranslationIndex(this.current, n);
        return translated[translationIndex];
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
          case 'zh_CN':
            return 'zh_CN';
          default:
            // eslint-disable-next-line no-console
            console.error(`Unexpected language: ${lang}`);
            return lang;
        }
      },

      updateElement(element, binding, vnode) {
        const attrs = vnode.data.attrs ?? {};
        const msgid = el.dataset.msgid;
        const translateContext = attrs['translate-context'];
        const translateN = attrs['translate-n'];
        const translatePlural = attrs['translate-plural'];
        const isPlural = translateN !== undefined && translatePlural !== undefined;
        let context = vnode.context;

        if (!isPlural && (translateN || translatePlural)) {
          // eslint-disable-next-line
          console.error('`translate-n` and `translate-plural` attributes must be used together:' + msgid + '.');
        }

        if (binding.value && typeof binding.value === 'object') {
          context = Object.assign({}, vnode.context, binding.value);
        }

        const translation = this.gettext(msgid, translateContext, translateN, isPlural ? translatePlural : null);
        const msg = interpolate(translation, context);
        element.innerText = msg;
      },
    },
  });

  Vue.directive('translate', {
    bind(el, binding, vnode) {
      // Check we can extract msgid
      if (element.childNodes.length > 1 || element.firstChild.nodeType !== TEXT_NODE) {
        // eslint-disable-next-line no-console
        console.error('v-translate must contain only text', element.childNodes);
        return;
      }

      const msgid = cleanMessageId(el.innerText);
      el.dataset.msgid = msgid;

      // Output an info in the console if an interpolation is required but no expression is provided.
      const hasInterpolation = msgid.indexOf('%{') !== -1;
      if (hasInterpolation && !binding.expression) {
        // eslint-disable-next-line no-console
        console.warn(
          `No expression is provided for change detection. The translation for this key will be static:\n${msgid}`
        );
      }

      languageVm.updateElement(el, binding, vnode);
    },
    inserted(el, binding, vnode) {
      languageVm.updateElement(el, binding, vnode);
    },
    update(el, binding, vnode) {
      languageVm.updateElement(el, binding, vnode);
    },
  });

  Vue.prototype.$language = languageVm;
  Vue.prototype.$gettext = languageVm.gettext.bind(languageVm);
  Vue.prototype.$interpolate = interpolate;
}
