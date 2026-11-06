/// <reference lib="webworker" />
// The service worker of the app, built by vite-plugin-pwa (injectManifest, see vite.config.ts): the start of the app
// is cached at install, the other files of the build the first time they are used, and a page is the last index.html
// received. A page opened once opens again without a network, and so do the documents of "My topos" saved offline
import { get, set } from 'idb-keyval';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

import { networkFirst } from '@/pwa/network-first';
import { docKey, isOfflineEntry, type SavedEntry } from '@/pwa/offline-store';
import { keepShell, SHELL_CACHE, shellKey } from '@/pwa/shell';

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

// a new version takes over the open pages at once: register-service-worker.ts reloads them, out of the forms. The first
// one keeps the page of the app (shell.ts): the page of the visit loaded before it, the app would not start offline.
// Without a network, the install goes on: the next page loaded online is kept
self.addEventListener('install', (event) => {
  void self.skipWaiting();
  event.waitUntil(keepShell(self.registration.scope).catch(() => false));
});
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Pages: the network first, the last copy received without it. index.html isn't in the precache: the server writes
// in it, for each request, the nonce of its Content-Security-Policy and the backend urls (shell.ts)
const SHELL_KEY = shellKey(self.registration.scope);
// the cache opened when needed: one that cannot open (storage cleared, private browsing) is no copy, never an error
const shell = () => caches.open(SHELL_CACHE);

registerRoute(
  new NavigationRoute(
    ({ request }) =>
      networkFirst(
        request,
        async () => (await shell()).match(SHELL_KEY),
        async (response) => (await shell()).put(SHELL_KEY, response)
      ),
    {
      // files of the site that are not the app
      denylist: [/^\/google\w*\.html$/, /^\/health/],
    }
  )
);

// The documents of "My topos" saved offline (src/pwa/offline-store.ts): the API answers ?cook= with the saved copy
// when the network fails, whatever the language asked (there is one copy, the best answer without a network). Online,
// the copy follows what the API answers in its language
const COOKED_DOCUMENT = /^\/(article|book|image|outing|route|waypoint|xreport)s\/(\d+)$/;

registerRoute(
  ({ url }) => COOKED_DOCUMENT.test(url.pathname) && url.searchParams.has('cook'),
  async ({ request, url }) => {
    const [, type, id] = COOKED_DOCUMENT.exec(url.pathname)!;
    const key = docKey(type, id);
    const saved = () => get<SavedEntry>(key).catch(() => undefined);
    return networkFirst(
      request,
      async () => {
        const entry = await saved();
        return isOfflineEntry(entry)
          ? new Response(JSON.stringify(entry.data), { headers: { 'Content-Type': 'application/json' } })
          : undefined;
      },
      async (response) => {
        const entry = await saved();
        if (isOfflineEntry(entry) && url.searchParams.get('cook') === entry.lang) {
          await set(key, { ...entry, data: await response.json(), downloadedAt: Date.now() } satisfies SavedEntry);
        }
      }
    );
  }
);

// The images and map tiles of the documents saved offline, downloaded by src/stores/offline.ts with CORS. Not the
// opaque answers of the <img> and tiles of the pages (status 0): the browser counts several MB of quota for each
const keptAWhile = (cacheName: string, maxEntries: number) =>
  new CacheFirst({
    cacheName,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries, maxAgeSeconds: 90 * 24 * 3600, purgeOnQuotaError: true }),
    ],
  });

registerRoute(
  ({ url }) =>
    url.origin !== self.location.origin &&
    /(^|\.)camptocamp\.org$/.test(url.hostname) &&
    (url.pathname.startsWith('/images/proxy/') || /\.(jpe?g|png|gif|svg|webp|avif)$/i.test(url.pathname)),
  keptAWhile('c2c-images', 1000)
);

registerRoute(({ url }) => url.hostname.endsWith('.tile.opentopomap.org'), keptAWhile('c2c-map-tiles', 3000));
