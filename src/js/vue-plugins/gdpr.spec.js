import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const YEAR = 1000 * 60 * 60 * 24 * 365;
const NOW = new Date('2026-10-19T12:00:00Z').getTime();

// the local-storage plugin caches what it read: fresh modules for each test, as for each page load
const installGdpr = async () => {
  vi.resetModules();
  const { default: localStorage } = await import('./local-storage');
  const { default: gdpr } = await import('./gdpr');
  // and the same Vue copy as the plugin
  const { createLocalVue } = await import('@vue/test-utils');
  const localVue = createLocalVue();
  localVue.use(localStorage);
  localVue.prototype.$ga = { enable: vi.fn(), disable: vi.fn() };
  localVue.use(gdpr);
  return localVue;
};

const stored = () => JSON.parse(window.localStorage.getItem('Gdpr.preferences') ?? '{}').choice;

describe('$gdpr', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    window.localStorage.clear();
  });

  afterEach(() => vi.useRealTimers());

  it('has no choice before the user makes one', async () => {
    const { prototype } = await installGdpr();

    expect(prototype.$gdpr.get()).toBe(null);
  });

  it('stores the choice with its date, under the key existing users already have', async () => {
    const { prototype } = await installGdpr();

    prototype.$gdpr.set({ statistics: true, social: false, ad: false });

    const choice = { statistics: true, social: false, ad: false, date: NOW };
    expect(prototype.$gdpr.get()).toEqual(choice);
    expect(prototype.$gdpr.gdprValue).toEqual(choice);
    expect(stored()).toEqual(choice);
    expect(prototype.$ga.enable).toHaveBeenCalled();
  });

  it('accepts or denies everything, and turns analytics on or off', async () => {
    const { prototype } = await installGdpr();

    prototype.$gdpr.setAll(false);
    expect(prototype.$gdpr.get()).toEqual({ statistics: false, social: false, ad: false, date: NOW });
    expect(prototype.$ga.disable).toHaveBeenCalled();

    prototype.$gdpr.setAll(true);
    expect(prototype.$gdpr.get()).toMatchObject({ statistics: true, social: true, ad: true });
    expect(prototype.$ga.enable).toHaveBeenCalled();
  });

  it('restores a choice made less than a year ago', async () => {
    const choice = { statistics: false, social: true, ad: false, date: NOW - YEAR + 1000 };
    window.localStorage.setItem('Gdpr.preferences', JSON.stringify({ choice }));

    expect((await installGdpr()).prototype.$gdpr.get()).toEqual(choice);
  });

  it('asks again after a year', async () => {
    const choice = { statistics: true, social: true, ad: true, date: NOW - YEAR - 1000 };
    window.localStorage.setItem('Gdpr.preferences', JSON.stringify({ choice }));

    expect((await installGdpr()).prototype.$gdpr.get()).toBe(null);
    expect(stored()).toBeUndefined();
  });

  it('updates the components showing it', async () => {
    const localVue = await installGdpr();
    const { mount } = await import('@vue/test-utils');
    const { nextTick } = await import('vue');
    const wrapper = mount({ render: (h) => h('p', localVue.prototype.$gdpr.get() ? 'chosen' : 'ask') }, { localVue });
    expect(wrapper.text()).toBe('ask');

    localVue.prototype.$gdpr.setAll(true);
    await nextTick();

    expect(wrapper.text()).toBe('chosen');
  });
});
