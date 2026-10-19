import { reactive } from 'vue';

import { getPreferences } from './local-storage';

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

export default function install(Vue) {
  // stored under the name of the former Gdpr component, so that existing choices are kept
  const preferences = getPreferences('Gdpr');
  const state = reactive({ gdprValue: undefined });

  try {
    let storedValue = preferences.get('choice');
    // if choice is over a year, consent must be asked again
    if (Date.now() - (storedValue?.date ?? 0) > ONE_YEAR) {
      preferences.clear();
      storedValue = null;
    }
    state.gdprValue = storedValue;
  } catch (err) {
    state.gdprValue = undefined;
  }

  Vue.prototype.$gdpr = {
    get gdprValue() {
      return state.gdprValue;
    },

    get() {
      return state.gdprValue;
    },

    set(newValue) {
      if (newValue) {
        state.gdprValue = { ...newValue, date: Date.now() };
        preferences.set('choice', state.gdprValue);
      } else {
        state.gdprValue = undefined;
      }

      if (newValue?.statistics) {
        Vue.prototype.$ga.enable();
      } else {
        Vue.prototype.$ga.disable();
      }
    },

    setAll(accept) {
      this.set(accept ? { statistics: true, social: true, ad: true } : { statistics: false, social: false, ad: false });
    },
  };
}
