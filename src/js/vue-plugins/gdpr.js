import { reactive } from 'vue';

import { getNamedLocalStorageItem } from '@/js/vue-plugins/local-storage';

export default function install(app) {
  const globals = app.config.globalProperties;
  const storage = getNamedLocalStorageItem('Gdpr');

  const gdpr = reactive({
    gdprValue: undefined,
  });

  // init (former created() hook)
  try {
    let storedValue = storage.get('choice');
    // if choice is over a year, consent must be asked again
    if (Date.now() - (storedValue?.date ?? 0) > 1000 * 60 * 60 * 24 * 365) {
      storage.clear();
      storedValue = null;
    }
    gdpr.gdprValue = storedValue;
  } catch (err) {
    gdpr.gdprValue = undefined;
  }

  gdpr.get = function () {
    return gdpr.gdprValue;
  };

  gdpr.set = function (newValue) {
    if (newValue) {
      gdpr.gdprValue = { ...newValue, date: Date.now() };
      storage.set('choice', gdpr.gdprValue);
    } else {
      gdpr.gdprValue = undefined;
    }

    if (newValue?.statistics) {
      globals.$ga.enable();
    } else {
      globals.$ga.disable();
    }
  };

  gdpr.setAll = function (accept) {
    gdpr.set(accept ? { statistics: true, social: true, ad: true } : { statistics: false, social: false, ad: false });
  };

  app.config.globalProperties.$gdpr = gdpr;
}
