// The choice of the user about the cookies (GDPR), kept a year in the local storage of the browser
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getPreferences } from '@/js/vue-plugins/local-storage';

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

// the user's choice, per kind of cookies, and when it was made
export type GdprChoice = { statistics?: boolean; social?: boolean; ad?: boolean; date?: number };

export const useGdprStore = defineStore('gdpr', () => {
  // stored under the name of the former Gdpr component, so that existing choices are kept
  const preferences = getPreferences('Gdpr');

  // undefined: not chosen yet
  const gdprValue = ref<GdprChoice | null | undefined>(undefined);

  try {
    let storedValue = preferences.get<GdprChoice | null>('choice');
    // if choice is over a year, consent must be asked again
    if (Date.now() - (storedValue?.date ?? 0) > ONE_YEAR) {
      preferences.clear();
      storedValue = null;
    }
    gdprValue.value = storedValue;
  } catch {
    gdprValue.value = undefined;
  }

  function get() {
    return gdprValue.value;
  }

  function set(newValue: GdprChoice | null | undefined) {
    if (newValue) {
      gdprValue.value = { ...newValue, date: Date.now() };
      preferences.set('choice', gdprValue.value);
    } else {
      gdprValue.value = undefined;
    }
  }

  function setAll(accept: boolean) {
    set(accept ? { statistics: true, social: true, ad: true } : { statistics: false, social: false, ad: false });
  }

  return { gdprValue, get, set, setAll };
});

export type Gdpr = ReturnType<typeof useGdprStore>;
