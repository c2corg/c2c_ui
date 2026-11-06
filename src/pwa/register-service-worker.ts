// Registers the service worker (src/pwa/service-worker.ts) in production builds, looks for a new version often, and
// reloads the page when one takes over: the page in memory runs the old code, whose chunks the new version no longer
// has. Never on top of a form, whose author may be away fetching a trace from a watch
import type { RouteLocationNormalized, Router } from 'vue-router';

// a new version is looked for when the page is shown again (a phone app stays open for days), and every hour
const UPDATE_CHECK_INTERVAL_MS = 3600 * 1000;
// once per tab: an activation racing another must not reload in a loop
const RELOADED_KEY = 'c2c.serviceWorkerReloaded';

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

export default function registerServiceWorker(router: Router) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  // the first installation takes control of the page without any new code to load: no reload then
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || sessionStorage.getItem(RELOADED_KEY)) {
      return;
    }
    reloadOutOfForms(router, () => {
      sessionStorage.setItem(RELOADED_KEY, 'true');
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
