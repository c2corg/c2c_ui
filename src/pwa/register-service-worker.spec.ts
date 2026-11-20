// A new version of the app reloads the page, but never under a form being filled
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type RouteLocationNormalized, type Router } from 'vue-router';

import { reloadOutOfForms, reloadedRecently, watchLoadedAssets } from './register-service-worker';

const route = (name: string) => ({ name }) as unknown as RouteLocationNormalized;

// a router on a route, whose afterEach hooks the test can call
const fakeRouter = (current: string) => {
  const hooks: ((to: RouteLocationNormalized, from: RouteLocationNormalized) => void)[] = [];
  const router = {
    currentRoute: { value: route(current) },
    afterEach: (hook: (typeof hooks)[number]) => hooks.push(hook),
  } as unknown as Router;
  const navigate = (from: string, to: string) => hooks.forEach((hook) => hook(route(to), route(from)));
  return { router, navigate };
};

describe('reloadOutOfForms', () => {
  it('reloads at once out of a form', () => {
    const reload = vi.fn();
    reloadOutOfForms(fakeRouter('home').router, reload);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('waits for the form, and for the page reached by leaving it', () => {
    const reload = vi.fn();
    const { router, navigate } = fakeRouter('outing-add');
    reloadOutOfForms(router, reload);
    expect(reload).not.toHaveBeenCalled();

    navigate('outing-add', 'outing'); // the saved outing, with its confirmation
    expect(reload).not.toHaveBeenCalled();
    navigate('outing', 'outing'); // the same page rewriting its address
    expect(reload).not.toHaveBeenCalled();

    navigate('outing', 'home');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('reloadedRecently', () => {
  // the guard against a reload loop holds a few seconds, not for the whole life of the tab
  it('blocks a second reload right after the first, not a later version', () => {
    sessionStorage.clear();
    expect(reloadedRecently()).toBe(false);
    sessionStorage.setItem('c2c.serviceWorkerReloaded', String(Date.now()));
    expect(reloadedRecently()).toBe(true);
    expect(reloadedRecently(Date.now() + 60 * 1000)).toBe(false);
    // the value of a former version
    sessionStorage.setItem('c2c.serviceWorkerReloaded', 'true');
    expect(reloadedRecently()).toBe(false);
  });
});

describe('watchLoadedAssets', () => {
  afterEach(() => vi.unstubAllGlobals());

  // a PerformanceObserver that saw entries before it was created (buffered), and sees one more later
  const stubObserver = (before: string[], later: string[]) => {
    let callback: (list: { getEntries: () => { name: string }[] }) => void = () => {};
    class Observer {
      constructor(cb: typeof callback) {
        callback = cb;
      }
      observe = vi.fn(() => callback({ getEntries: () => before.map((name) => ({ name })) }));
      takeRecords = () => later.map((name) => ({ name }));
      disconnect = vi.fn();
    }
    vi.stubGlobal('PerformanceObserver', Observer);
  };

  it('asks again, once, for the files of the build loaded before the service worker', async () => {
    const asset = (name: string) => `${location.origin}/assets/${name}`;
    stubObserver(
      [asset('index-a1.js'), asset('RouteView-b2.js'), 'https://media.camptocamp.org/x.jpg', asset('index-a1.js')],
      [asset('C2cMap-c3.js')]
    );
    const fetch = vi.fn<(url: string) => Promise<Response>>(async () => new Response(''));
    vi.stubGlobal('fetch', fetch);

    await watchLoadedAssets('/')();

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      asset('index-a1.js'),
      asset('RouteView-b2.js'),
      asset('C2cMap-c3.js'),
    ]);
  });

  it('does nothing without PerformanceObserver, and a file the network refuses stops nothing', async () => {
    vi.stubGlobal('PerformanceObserver', undefined);
    const fetch = vi.fn(async () => {
      throw new TypeError('offline');
    });
    vi.stubGlobal('fetch', fetch);
    await expect(watchLoadedAssets('/')()).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
