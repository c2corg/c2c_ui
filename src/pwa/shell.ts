// The page of the app, kept to start it without a network (service-worker.ts). It is never the index.html of the
// build: the server writes in it, for each request, the nonce of its Content-Security-Policy and the backend urls of
// the container (see docker/nginx.conf). Every route of the app is the same page: one copy, as index.html, serves them
export const SHELL_CACHE = 'c2c-shell';

export const shellKey = (scope: string) => new URL('index.html', scope).href;

/**
 * Keeps the page of the app, as the server serves it, if no copy is kept yet. The service worker installs after the
 * first page of a visit has loaded: without this, the app would not start offline until another page was loaded.
 * Resolves with whether a copy is kept.
 */
export async function keepShell(scope: string): Promise<boolean> {
  const cache = await caches.open(SHELL_CACHE);
  if (await cache.match(shellKey(scope))) {
    return true;
  }
  const response = await fetch(scope, { credentials: 'same-origin' });
  if (!response.ok) {
    return false;
  }
  await cache.put(shellKey(scope), response);
  return true;
}
