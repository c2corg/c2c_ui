import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// fresh modules for each test, as for each page load: the local-storage plugin caches what it read
const installLanguage = async () => {
  vi.resetModules();
  const { default: gettext } = await import('./gettext-plugin');
  const { mount: mountComponent } = await import('@vue/test-utils');
  const { createApp, h, nextTick } = await import('vue');

  const app = createApp({});
  const globals = app.config.globalProperties;
  globals.$user = { saveLangPreference: vi.fn() };
  app.use(gettext);

  // components mounted with what the plugin installed in the app
  const mount = (component) =>
    mountComponent(component, {
      global: {
        mocks: { $language: globals.$language, $gettext: globals.$gettext },
        directives: { translate: app.directive('translate') },
      },
    });

  // firstLoad() and setCurrent() apply the language once its translations are loaded (lazily, except French),
  // and set the page language last
  const settle = (lang = 'fr') =>
    vi.waitFor(
      () => {
        if (document.documentElement.lang !== globals.$language.getIANALanguageSubtag(lang)) {
          throw new Error(`${lang} not applied yet`);
        }
      },
      { timeout: 5000 }
    );
  return { globals, $language: globals.$language, h, mount, nextTick, settle };
};

const storedLanguage = () => JSON.parse(window.localStorage.getItem('Language.preferences') ?? '{}').current;

describe('$language / $gettext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('lang');
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts in French, translated once firstLoad() has run (main.js calls it)', async () => {
    const { globals, $language, settle } = await installLanguage();
    expect($language.current).toBe('fr');
    expect(globals.$gettext('Login')).toBe('Login');

    $language.firstLoad();
    await settle();

    expect(globals.$gettext('Login')).toBe('Se connecter');
    expect(globals.$gettext('1', 'paragliding_ratings')).toBe('P1');
    expect(globals.$gettext('Not a known message')).toBe('Not a known message');
  });

  it('starts in the stored language, under the key existing users already have', async () => {
    window.localStorage.setItem('Language.preferences', JSON.stringify({ current: 'it' }));

    const { $language } = await installLanguage();

    expect($language.current).toBe('it');
  });

  it('loads the translations of the first language, and sets the page language', async () => {
    window.localStorage.setItem('Language.preferences', JSON.stringify({ current: 'de' }));
    const { globals, $language, settle } = await installLanguage();

    $language.firstLoad();
    await settle('de');

    expect($language.current).toBe('de');
    expect(globals.$gettext('Login')).toBe('Einloggen');
    expect(document.documentElement.getAttribute('lang')).toBe('de');
  });

  it('switches language: loads it, stores it, saves the user preference', async () => {
    const { globals, $language, settle } = await installLanguage();

    $language.setCurrent('de');
    await settle('de');

    expect($language.current).toBe('de');
    expect(globals.$gettext('Save')).toBe('Speichern');
    expect(storedLanguage()).toBe('de');
    expect(globals.$user.saveLangPreference).toHaveBeenCalledWith('de');
    expect(document.documentElement.getAttribute('lang')).toBe('de');
  });

  it('uses the IANA subtag for the page language', async () => {
    const { $language, settle } = await installLanguage();

    $language.setCurrent('zh_CN');
    await settle('zh_CN');

    expect(document.documentElement.getAttribute('lang')).toBe('zh');
  });

  it('maps languages to IANA subtags and ISO territories', async () => {
    const { $language } = await installLanguage();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect($language.getIANALanguageSubtag('zh_CN')).toBe('zh');
    expect($language.getIANALanguageSubtag('eu')).toBe('eu');
    expect($language.getIsoLanguageTerritory('en')).toBe('en_UK');
    expect($language.getIsoLanguageTerritory('zh')).toBe('zh_CN');
    expect($language.getIsoLanguageTerritory('xx')).toBe('xx');
  });

  it('lists the languages of the UI and of the API', async () => {
    const { $language } = await installLanguage();

    expect(Object.keys($language.availableUI)).toEqual(['fr', 'it', 'de', 'en', 'es', 'ca', 'eu', 'hu', 'zh_CN', 'sl']);
    expect(Object.keys($language.availableAPI)).toEqual(['fr', 'it', 'de', 'en', 'es', 'ca', 'eu', 'zh', 'sl']);
  });

  it('updates the components using $gettext on a language switch', async () => {
    const { $language, h, mount, nextTick, settle } = await installLanguage();
    $language.firstLoad();
    await settle();
    const wrapper = mount({
      render() {
        return h('p', this.$gettext('Save'));
      },
    });
    expect(wrapper.text()).toBe('Enregistrer');

    document.documentElement.removeAttribute('lang');
    $language.setCurrent('de');
    await settle('de');
    await nextTick();

    expect(wrapper.text()).toBe('Speichern');
  });

  it('translates v-translate elements', async () => {
    const { $language, mount, settle } = await installLanguage();
    $language.firstLoad();
    await settle();

    const wrapper = mount({
      template: `<div><span v-translate>Save</span><span v-translate translate-context="paragliding_ratings">1</span></div>`,
    });

    expect(wrapper.findAll('span').map((span) => span.text())).toEqual(['Enregistrer', 'P1']);
  });

  it('translates v-translate on a component rendering its slot, and keeps the slot in place', async () => {
    const { $language, mount, nextTick, settle } = await installLanguage();
    $language.firstLoad();
    await settle();

    // as <login-button>, <edit-link>, <association-history-link>...: Vue 3 renders the slot between two empty text
    // nodes, which it later inserts and removes content around
    const SlotLink = { template: '<a><slot /></a>' };
    const wrapper = mount({
      components: { SlotLink },
      data: () => ({ shown: true }),
      template: `<div><slot-link v-if="shown" v-translate>Save</slot-link><span>after</span></div>`,
    });

    expect(wrapper.find('a').text()).toBe('Enregistrer');

    await wrapper.setData({ shown: false });
    await nextTick();
    expect(wrapper.text()).toBe('after');
  });
});
