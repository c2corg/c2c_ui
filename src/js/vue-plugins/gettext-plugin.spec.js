import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

// fresh modules for each test, as for each page load: the local-storage plugin caches what it read
const installLanguage = async () => {
  vi.resetModules();
  const { default: gettext } = await import('./gettext-plugin');
  const { createLocalVue, mount } = await import('@vue/test-utils');
  const { nextTick } = await import('vue');

  const localVue = createLocalVue();
  localVue.prototype.$user = { saveLangPreference: vi.fn() };
  localVue.use(gettext);

  // firstLoad() and setCurrent() apply the language once its translations are loaded (lazily, except French),
  // and set the page language last
  const settle = (lang = 'fr') =>
    vi.waitFor(
      () => {
        if (document.documentElement.lang !== localVue.prototype.$language.getIANALanguageSubtag(lang)) {
          throw new Error(`${lang} not applied yet`);
        }
      },
      { timeout: 5000 }
    );
  return { localVue, $language: localVue.prototype.$language, mount, nextTick, settle };
};

const storedLanguage = () => JSON.parse(window.localStorage.getItem('Language.preferences') ?? '{}').current;

describe('$language / $gettext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('lang');
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts in French, translated once firstLoad() has run (main.js calls it)', async () => {
    const { localVue, $language, settle } = await installLanguage();
    expect($language.current).toBe('fr');
    expect(localVue.prototype.$gettext('Login')).toBe('Login');

    $language.firstLoad();
    await settle();

    expect(localVue.prototype.$gettext('Login')).toBe('Se connecter');
    expect(localVue.prototype.$gettext('1', 'paragliding_ratings')).toBe('P1');
    expect(localVue.prototype.$gettext('Not a known message')).toBe('Not a known message');
  });

  it('starts in the stored language, under the key existing users already have', async () => {
    window.localStorage.setItem('Language.preferences', JSON.stringify({ current: 'it' }));

    const { $language } = await installLanguage();

    expect($language.current).toBe('it');
  });

  it('loads the translations of the first language, and sets the page language', async () => {
    window.localStorage.setItem('Language.preferences', JSON.stringify({ current: 'de' }));
    const { localVue, $language, settle } = await installLanguage();

    $language.firstLoad();
    await settle('de');

    expect($language.current).toBe('de');
    expect(localVue.prototype.$gettext('Login')).toBe('Einloggen');
    expect(document.documentElement.getAttribute('lang')).toBe('de');
  });

  it('switches language: loads it, stores it, saves the user preference', async () => {
    const { localVue, $language, settle } = await installLanguage();

    $language.setCurrent('de');
    await settle('de');

    expect($language.current).toBe('de');
    expect(localVue.prototype.$gettext('Save')).toBe('Speichern');
    expect(storedLanguage()).toBe('de');
    expect(localVue.prototype.$user.saveLangPreference).toHaveBeenCalledWith('de');
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
    const { localVue, $language, mount, nextTick, settle } = await installLanguage();
    $language.firstLoad();
    await settle();
    const wrapper = mount({ render: (h) => h('p', localVue.prototype.$gettext('Save')) }, { localVue });
    expect(wrapper.text()).toBe('Enregistrer');

    document.documentElement.removeAttribute('lang');
    $language.setCurrent('de');
    await settle('de');
    await nextTick();

    expect(wrapper.text()).toBe('Speichern');
  });

  it('translates v-translate elements', async () => {
    // jsdom has no innerText, which v-translate reads and writes
    const innerText = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
      configurable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      },
    });
    onTestFinished(() =>
      innerText
        ? Object.defineProperty(HTMLElement.prototype, 'innerText', innerText)
        : delete HTMLElement.prototype.innerText
    );

    const { localVue, $language, mount, settle } = await installLanguage();
    $language.firstLoad();
    await settle();
    const { compileToFunctions } = await import('vue-template-compiler');

    const wrapper = mount(
      compileToFunctions(
        `<div><span v-translate>Save</span><span v-translate translate-context="paragliding_ratings">1</span></div>`
      ),
      { localVue }
    );

    expect(wrapper.findAll('span').wrappers.map((span) => span.text())).toEqual(['Enregistrer', 'P1']);
  });
});
