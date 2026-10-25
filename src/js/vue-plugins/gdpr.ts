import { type App, reactive } from 'vue';

import { getPreferences } from './local-storage';

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

// the user's choice, per kind of cookies, and when it was made
export type GdprChoice = { statistics?: boolean; social?: boolean; ad?: boolean; date?: number };

export type Gdpr = {
  readonly gdprValue: GdprChoice | null | undefined;
  get(): GdprChoice | null | undefined;
  set(newValue: GdprChoice | null | undefined): void;
  setAll(accept: boolean): void;
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $gdpr: Gdpr;
  }
}

export default function install(app: App) {
  // stored under the name of the former Gdpr component, so that existing choices are kept
  const preferences = getPreferences('Gdpr');
  const state = reactive<{ gdprValue: GdprChoice | null | undefined }>({ gdprValue: undefined });

  try {
    let storedValue = preferences.get<GdprChoice | null>('choice');
    // if choice is over a year, consent must be asked again
    if (Date.now() - (storedValue?.date ?? 0) > ONE_YEAR) {
      preferences.clear();
      storedValue = null;
    }
    state.gdprValue = storedValue;
  } catch {
    state.gdprValue = undefined;
  }

  const gdpr: Gdpr = {
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
        app.config.globalProperties.$ga.enable();
      } else {
        app.config.globalProperties.$ga.disable();
      }
    },

    setAll(accept) {
      this.set(accept ? { statistics: true, social: true, ad: true } : { statistics: false, social: false, ad: false });
    },
  };
  app.config.globalProperties.$gdpr = gdpr;
}
