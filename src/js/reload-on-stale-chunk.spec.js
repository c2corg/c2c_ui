import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Vue from 'vue';
import VueRouter from 'vue-router';

import reloadOnStaleChunk from './reload-on-stale-chunk';

Vue.use(VueRouter);

const fakeWindow = ({ sessionStorage } = {}) => {
  const win = new EventTarget();
  win.location = { reload: vi.fn(), assign: vi.fn() };
  const store = new Map();
  win.sessionStorage = sessionStorage ?? {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  return win;
};

const preloadError = () => new Event('vite:preloadError');

// a lazy route whose chunk is gone: Vite emits vite:preloadError, then the import rejects
const createRouter = (win) =>
  new VueRouter({
    mode: 'abstract',
    routes: [
      { path: '/', component: { render: (h) => h('div') } },
      {
        path: '/yeti/:id?',
        component: () => {
          win.dispatchEvent(preloadError());
          return Promise.reject(new TypeError('Failed to fetch dynamically imported module'));
        },
      },
    ],
  });

describe('reloadOnStaleChunk', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reloads the current page when a chunk fails outside of a navigation', () => {
    const win = fakeWindow();
    reloadOnStaleChunk(createRouter(win), win);

    win.dispatchEvent(preloadError());

    expect(win.location.reload).toHaveBeenCalledTimes(1);
    expect(win.location.assign).not.toHaveBeenCalled();
  });

  it('reloads onto the target route when the chunk was needed by a navigation', async () => {
    const win = fakeWindow();
    const router = createRouter(win);
    reloadOnStaleChunk(router, win);
    await router.push('/');

    await router.push('/yeti/42?lang=fr').catch(() => {});

    expect(win.location.assign).toHaveBeenCalledWith('/yeti/42?lang=fr');
    expect(win.location.reload).not.toHaveBeenCalled();
  });

  it('reloads the current page once the navigation is over', async () => {
    const win = fakeWindow();
    const router = createRouter(win);
    reloadOnStaleChunk(router, win);
    await router.push('/');

    win.dispatchEvent(preloadError());

    expect(win.location.reload).toHaveBeenCalledTimes(1);
    expect(win.location.assign).not.toHaveBeenCalled();
  });

  it('does not reload again within a minute, to avoid a reload loop', () => {
    const win = fakeWindow();
    reloadOnStaleChunk(createRouter(win), win);

    win.dispatchEvent(preloadError());
    vi.advanceTimersByTime(59 * 1000);
    win.dispatchEvent(preloadError());

    expect(win.location.reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again after a minute', () => {
    const win = fakeWindow();
    reloadOnStaleChunk(createRouter(win), win);

    win.dispatchEvent(preloadError());
    vi.advanceTimersByTime(61 * 1000);
    win.dispatchEvent(preloadError());

    expect(win.location.reload).toHaveBeenCalledTimes(2);
  });

  it('reloads the current page after a failed navigation whose reload was skipped', async () => {
    const win = fakeWindow();
    const router = createRouter(win);
    reloadOnStaleChunk(router, win);
    await router.push('/');

    win.dispatchEvent(preloadError());
    await router.push('/yeti/42').catch(() => {}); // within a minute: no reload
    vi.advanceTimersByTime(61 * 1000);
    win.dispatchEvent(preloadError());

    expect(win.location.reload).toHaveBeenCalledTimes(2);
    expect(win.location.assign).not.toHaveBeenCalled();
  });

  it('does not reload when session storage is not available, as it could loop', () => {
    const throwing = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    const win = fakeWindow({ sessionStorage: { getItem: throwing, setItem: throwing } });
    reloadOnStaleChunk(createRouter(win), win);

    win.dispatchEvent(preloadError());

    expect(win.location.reload).not.toHaveBeenCalled();
    expect(win.location.assign).not.toHaveBeenCalled();
  });
});
