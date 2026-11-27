// Registers the service worker (src/pwa/service-worker.ts) in production builds, looks for a new version often, and
// reloads the page when one takes over: the page in memory runs the old code, whose chunks the new version no longer
// has. Never on top of a form, whose author may be away fetching a trace from a watch
import type { RouteLocationNormalized, Router } from 'vue-router';

// a new version is looked for when the page is shown again (a phone app stays open for days), and every hour
const UPDATE_CHECK_INTERVAL_MS = 3600 * 1000;
// an activation racing another must not reload in a loop, but a later version, days after, must reload
const RELOADED_KEY = 'c2c.serviceWorkerReloaded';
const RELOAD_LOOP_MS = 10 * 1000;

export const reloadedRecently = (now = Date.now()) =>
  now - Number(sessionStorage.getItem(RELOADED_KEY) ?? 0) < RELOAD_LOOP_MS;

const isForm = (route: RouteLocationNormalized) => /-(add|edit)$/.test(String(route.name ?? ''));

export function reloadOutOfForms(router: Router, reload: () => void) {
  if (!isForm(router.currentRoute.value)) {
    reload();
    return;
  }
  // after the form, and after the page reached by leaving it, which confirms the save: at the next change of page
  // (by route name: a document page rewrites its address with its title once loaded)
  router.afterEach((to, from) => {
    if (to.name !== from.name && !isForm(to) && !isForm(from)) {
      reload();
    }
  });
}

/**
 * Collects the files of the build the page loads before the first service worker takes control, which it does not see.
 * A module is loaded once, the page never asks for them again: a topo saved offline on that first visit opened a blank
 * page without a network, its view never kept (src/stores/offline.ts imports it, already loaded). The returned function
 * asks for them again, through the service worker that now controls the page, which keeps them (c2c-assets)
 */
export function watchLoadedAssets(base: string) {
  const assets = new URL('assets/', new URL(base, location.origin)).href;
  const urls = new Set<string>();
  const collect = (entries: PerformanceEntryList) =>
    entries.forEach((entry) => entry.name.startsWith(assets) && urls.add(entry.name));
  let observer: PerformanceObserver | undefined;
  try {
    // an observer, not performance.getEntries(): its buffer stops at 250 entries, the images of a page fill it
    observer = new PerformanceObserver((list) => collect(list.getEntries()));
    observer.observe({ type: 'resource', buffered: true });
  } catch {
    // an old browser: the files are kept when they are next loaded, on the next visit
  }
  return async () => {
    if (observer) {
      collect(observer.takeRecords());
      observer.disconnect();
    }
    await Promise.all([...urls].map((url) => fetch(url).catch(() => undefined)));
  };
}

export default function registerServiceWorker(router: Router) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  // the first installation takes control of the page without any new code to load: no reload then, the files the page
  // already loaded kept instead
  const hadController = !!navigator.serviceWorker.controller;
  const keepLoadedAssets = hadController ? undefined : watchLoadedAssets(import.meta.env.BASE_URL);
  let firstControl = !hadController;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (firstControl) {
      firstControl = false;
      void keepLoadedAssets?.();
      return;
    }
    if (!hadController || reloadedRecently()) {
      return;
    }
    reloadOutOfForms(router, () => {
      sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
      window.location.reload();
    });
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .then((registration) => {
        const update = () => registration.update().catch(() => undefined); // offline, server down: next time
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            void update();
          }
        });
        setInterval(() => void update(), UPDATE_CHECK_INTERVAL_MS);
      })
      .catch((error: unknown) => {
        console.error('Service worker registration failed', error);
      });
  });
}
