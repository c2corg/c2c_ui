import Messages from 'messageformat/messages';

import french_translations from '@/translations/fr.js';

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

  // trim
  msgid = msgid.replace(/^[\r\n\s]*/, '');
  msgid = msgid.replace(/[\r\n\s]*$/, '');

  // remove new lines and duplicated spaces
  msgid = msgid.replace(/\n/g, ' ');
  msgid = msgid.replace(/\s+/g, ' ');

  return msgid;
}

function getTranslation(messages, msgid, msgctxt, params) {
  if (messages === undefined) {
    // `messages are not yet available`
    return msgid;
  }
  return msgctxt ? messages.get([msgctxt, msgid], params) : messages.get(msgid, params);
}

function getMessages(lang) {
  if (lang === 'fr') {
    // include fr langage in app
    // and lazy load the others
    return french_translations;
  } else if (lang === 'en') {
    return import(/* webpackChunkName: "translations-en" */ `@/translations/en.js`);
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
          // this.current = null; // !FIXME what's the problem with reactivity here?
          this.current = lang;
          // set html lang attribute
          document.documentElement.setAttribute('lang', this.getIANALanguageSubtag(lang));
        });
      },

      _getMessages(lang) {
        // TODO : normally, webpack should handle this
        if (this.translations && this.translations.availableLocales.includes(lang)) {
          return new Promise((resolve) => {
            resolve(this.translations);
          });
        }

        const messages = getMessages(lang);

        return new Promise((resolve) => {
          if (messages instanceof Promise) {
            // messages is a promise
            messages.then(({ default: translations }) => {
              if (!this.translations) {
                this.translations = new Messages(translations, lang);
              } else {
                this.translations.addMessages(translations[lang], lang);
              }
              this.translations.locale = lang;
              resolve();
            });
          } else {
            if (!this.translations) {
              this.translations = new Messages(messages, lang);
            } else {
              this.translations.addMessages(messages[lang], lang);
            }
            resolve();
          }
        });
      },

      gettext(msgid, msgctxt, params) {
        return getTranslation(this.translations, msgid, msgctxt, params);
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

      updateElement(element, binding) {
        if (element.dataset.msgid === undefined) {
          if (element.childNodes.length > 1 || element.firstChild.nodeType !== TEXT_NODE) {
            // eslint-disable-next-line
            console.error('v-translate must contain only text', element.childNodes);
            return;
          }

          element.dataset.msgid = cleanMessageId(element.innerText);
        }

        element.innerText = this.gettext(
          element.dataset.msgid,
          binding.value?.ctxt || binding.value?.context,
          binding.value?.params
        );
      },
    },
  });

  // An option to support translation with HTML content: `v-translate`.
  Vue.directive('translate', {
    bind(el, binding) {
      languageVm.updateElement(el, binding);
    },
    inserted(el, binding) {
      languageVm.updateElement(el, binding);
    },
    update(el, binding) {
      languageVm.updateElement(el, binding);
    },
  });

  Vue.prototype.$language = languageVm;
  Vue.prototype.$gettext = languageVm.gettext.bind(languageVm);
}
