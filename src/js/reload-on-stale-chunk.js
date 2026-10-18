// After a deploy, a page opened before it requests lazy chunks that no longer exist (translations, edition views...).
// Vite then emits vite:preloadError: reload to get the new index.html, onto the target route when the chunk was needed
// by a navigation. At most once a minute, so that a chunk really missing from a deploy can't cause a reload loop.

const STORAGE_KEY = 'c2c.preloadErrorReload';
const MIN_DELAY_BETWEEN_RELOADS = 60 * 1000;

/**
 * @param {import('vue-router').default} router
 * @param {Window} win
 */
export default function reloadOnStaleChunk(router, win = window) {
  let pendingRoute = null;
  router.beforeEach((to, from, next) => {
    pendingRoute = to;
    next();
  });
  router.afterEach(() => {
    pendingRoute = null;
  });

  win.addEventListener('vite:preloadError', () => {
    try {
      if (Date.now() - Number(win.sessionStorage.getItem(STORAGE_KEY)) < MIN_DELAY_BETWEEN_RELOADS) {
        return;
      }
      win.sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // no session storage: reload anyway
    }
    if (pendingRoute) {
      win.location.assign(router.resolve(pendingRoute.fullPath).href);
    } else {
      win.location.reload();
    }
  });
}
