import { createLocalVue } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import VueRouter from 'vue-router';

import analytics, { shouldTrack } from './analytics';

const ID = 'G-TEST123';

const gtagScripts = () => document.head.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]');
const calls = () => (window.dataLayer ?? []).map((args) => [...args]);
const pageViews = () =>
  calls()
    .filter(([command, name]) => command === 'event' && name === 'page_view')
    .map(([, , params]) => params.page_location);

const install = async ({ id = ID, statistics } = {}) => {
  const localVue = createLocalVue();
  localVue.use(VueRouter);
  const router = new VueRouter({
    mode: 'history',
    routes: [
      { path: '/', name: 'home' },
      { path: '/routes', name: 'routes' },
      { path: '/routes/:id', name: 'route' },
    ],
  });
  localVue.prototype.$gdpr = { gdprValue: statistics === undefined ? undefined : { statistics } };
  localVue.use(analytics, { id, router });
  await router.push('/').catch(() => {});
  return { $ga: localVue.prototype.$ga, router };
};

describe('analytics', () => {
  beforeEach(() => {
    delete window.dataLayer;
    delete window[`ga-disable-${ID}`];
    gtagScripts().forEach((script) => script.remove());
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => gtagScripts().forEach((script) => script.remove()));

  it('loads nothing before the user accepts statistics', async () => {
    await install();

    expect(gtagScripts()).toHaveLength(0);
    expect(window.dataLayer).toBeUndefined();
  });

  it('loads nothing when statistics were refused', async () => {
    await install({ statistics: false });

    expect(gtagScripts()).toHaveLength(0);
  });

  it('loads gtag.js with the measurement ID when statistics were accepted earlier', async () => {
    await install({ statistics: true });

    expect([...gtagScripts()].map((script) => script.src)).toEqual([
      `https://www.googletagmanager.com/gtag/js?id=${ID}`,
    ]);
    expect(calls()).toContainEqual(['config', ID, { send_page_view: false, cookie_domain: 'none' }]);
    expect(pageViews()).toEqual(['http://localhost:3000/']);
  });

  it('sends the current page when the user accepts statistics on it, and loads gtag.js once', async () => {
    const { $ga, router } = await install();
    await router.push('/routes/12');

    $ga.enable();
    $ga.enable();

    expect(gtagScripts()).toHaveLength(1);
    expect(pageViews()).toEqual(['http://localhost:3000/routes/12']);
  });

  it('sends a page view when the page changes, not when only the query changes', async () => {
    const { router } = await install({ statistics: true });

    await router.push('/routes');
    await router.push('/routes?act=skitouring');
    await router.push('/routes/12');
    await router.push('/routes/12?lang=fr');
    await router.push('/routes/13');

    expect(pageViews()).toEqual([
      'http://localhost:3000/',
      'http://localhost:3000/routes',
      'http://localhost:3000/routes/12',
      'http://localhost:3000/routes/13',
    ]);
  });

  it('stops sending when the user withdraws consent, and starts again', async () => {
    const { $ga, router } = await install({ statistics: true });

    $ga.disable();
    await router.push('/routes');

    expect(window[`ga-disable-${ID}`]).toBe(true);
    expect(pageViews()).toEqual(['http://localhost:3000/']);

    $ga.enable();

    expect(window[`ga-disable-${ID}`]).toBe(false);
    expect(pageViews()).toEqual(['http://localhost:3000/', 'http://localhost:3000/routes']);
    expect(gtagScripts()).toHaveLength(1);
  });

  it.each(['', null, 'UA-2814179-1'])('does nothing without a GA4 measurement ID (%s)', async (id) => {
    const { $ga, router } = await install({ id, statistics: true });
    $ga.enable();
    await router.push('/routes');
    $ga.disable();

    expect(gtagScripts()).toHaveLength(0);
    expect(window.dataLayer).toBeUndefined();
  });

  it('compares route names and ids', () => {
    expect(shouldTrack({ name: 'route', params: { id: 12 } }, { name: 'route', params: { id: '12' } })).toBe(false);
    expect(shouldTrack({ name: 'route', params: { id: 13 } }, { name: 'route', params: { id: 12 } })).toBe(true);
    expect(shouldTrack({ name: 'routes', params: {} }, { name: 'home', params: {} })).toBe(true);
  });
});
