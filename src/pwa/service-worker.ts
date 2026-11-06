/// <reference lib="webworker" />
// The service worker of the app, built by vite-plugin-pwa (injectManifest, see vite.config.ts): the start of the app
// is cached at install, the other files of the build the first time they are used, and a page is the last index.html
// received. A page opened once opens again without a network
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// The other files of the build (pages, translations, images): their name carries a hash of their content, a file
// never changes, the copy is always right. The old versions go after a while
const ASSETS_PATH = new URL('assets/', self.registration.scope).pathname;
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith(ASSETS_PATH),
  new CacheFirst({
    cacheName: 'c2c-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 400, maxAgeSeconds: 90 * 24 * 3600, purgeOnQuotaError: true })],
  })
);

// a new version takes over the open pages at once: register-service-worker.ts reloads them, out of the forms
self.addEventListener('install', () => void self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Pages: the network first, the last copy received without it. index.html isn't in the precache: the server writes
// in it, for each request, the nonce of its Content-Security-Policy and the backend urls of the container (see
// docker/nginx.conf), which a copy of the build day would freeze. Every route of the app is the same index.html: one
// copy serves them all, a header of the response it came with
const SHELL_CACHE = 'c2c-shell';
const SHELL_KEY = new URL('index.html', self.registration.scope).href;
// a slow network is a mountain network: past this, the copy, then the network's answer for the next visit
const NETWORK_TIMEOUT_MS = 4000;

async function page({ request }: { request: Request }): Promise<Response> {
  const cache = await caches.open(SHELL_CACHE);
  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(SHELL_KEY, response.clone());
    }
    return response;
  });
  const cached = (copy: Response | undefined) => copy ?? network;
  const slow = new Promise<Response | undefined>((resolve) => {
    setTimeout(() => void cache.match(SHELL_KEY).then(resolve), NETWORK_TIMEOUT_MS);
  });
  try {
    return await Promise.race([network, slow.then(cached)]);
  } catch {
    // no network: the copy, else the browser's own offline page
    return (await cache.match(SHELL_KEY)) ?? Response.error();
  }
}

registerRoute(
  new NavigationRoute(page, {
    // files of the site that are not the app
    denylist: [/^\/google\w*\.html$/, /^\/health/],
  })
);
