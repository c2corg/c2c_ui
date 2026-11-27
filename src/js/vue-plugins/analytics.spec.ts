import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import analytics, { shouldTrack } from './analytics';

const ID = 'G-TEST123';

const gtagScripts = () =>
  document.head.querySelectorAll<HTMLScriptElement>('script[src^="https://www.googletagmanager.com/gtag/js"]');
// gtag.js pushes arguments objects
const calls = () => (window.dataLayer ?? []).map((args) => [...(args as IArguments)]);
const pageViews = () =>
  calls()
    .filter(([command, name]) => command === 'event' && name === 'page_view')
    .map(([, , params]) => (params as { page_location: string }).page_location);

const install = async ({ id = ID, statistics }: { id?: string | null; statistics?: boolean } = {}) => {
  const app = createApp({});
  // vue-router 4+ records need a component
  const component = { render: () => null };
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component },
      { path: '/routes', name: 'routes', component },
      { path: '/routes/:id', name: 'route', component },
    ],
  });
  app.config.globalProperties.$gdpr = { gdprValue: statistics === undefined ? undefined : { statistics } } as never;
  // an invalid id on purpose, null included
  app.use(analytics, { id: id as string, router });
  await router.push('/').catch(() => {});
  return { $ga: app.config.globalProperties.$ga, router };
};

describe('analytics', () => {
  beforeEach(() => {
    delete (window as Partial<Window>).dataLayer;
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
    // ids as numbers too: the views push them as such
    const location = (name: string, id?: number | string) =>
      ({ name, params: id === undefined ? {} : { id } }) as Parameters<typeof shouldTrack>[0];

    expect(shouldTrack(location('route', 12), location('route', '12'))).toBe(false);
    expect(shouldTrack(location('route', 13), location('route', 12))).toBe(true);
    expect(shouldTrack(location('routes'), location('home'))).toBe(true);
  });
});
