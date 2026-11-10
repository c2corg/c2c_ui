// After a deploy, a page opened before it requests lazy chunks that no longer exist (translations, edition views...).
// Vite then emits vite:preloadError: reload to get the new index.html, onto the target route when the chunk was needed
// by a navigation. At most once a minute, so that a chunk really missing from a deploy can't cause a reload loop.

const STORAGE_KEY = 'c2c.preloadErrorReload';
const MIN_DELAY_BETWEEN_RELOADS = 60 * 1000;

import type { RouteLocationNormalized, Router } from 'vue-router';

export default function reloadOnStaleChunk(router: Router, win: Window = window) {
  let pendingRoute: RouteLocationNormalized | null = null;
  router.beforeEach((to) => {
    pendingRoute = to;
  });
  router.afterEach(() => {
    pendingRoute = null;
  });
  // afterEach is not called when a navigation fails (the lazy chunk could not be loaded). vite:preloadError is
  // emitted before the import rejects, so the handler below has already seen the pending route.
  router.onError(() => {
    pendingRoute = null;
  });

  win.addEventListener('vite:preloadError', () => {
    try {
      if (Date.now() - Number(win.sessionStorage.getItem(STORAGE_KEY)) < MIN_DELAY_BETWEEN_RELOADS) {
        return;
      }
      win.sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // no session storage: no way to prevent a reload loop, so don't reload
      return;
    }
    if (pendingRoute) {
      win.location.assign(router.resolve(pendingRoute.fullPath).href);
    } else {
      win.location.reload();
    }
  });
}
