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

import { docKey, isOfflineEntry, type SavedEntry } from '@/pwa/offline-store';

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

// Pages: index.html isn't in the precache: the server writes in it, for each request, the nonce of its
// Content-Security-Policy and the backend urls of the container (see docker/nginx.conf), which a copy of the build day
// would freeze. Every route of the app is the same index.html: one copy serves them all, a header of the response it
// came with
const SHELL_CACHE = 'c2c-shell';
const SHELL_KEY = new URL('index.html', self.registration.scope).href;
// a slow network is a mountain network: past this, the copy
const NETWORK_TIMEOUT_MS = 4000;

// The network first; the copy when there is none, or when it is slow (then the network's answer for the next time).
// What the network answers replaces the copy
async function networkFirst(
  request: Request,
  copy: () => Promise<Response | undefined>,
  keep: (response: Response) => Promise<unknown>
): Promise<Response> {
  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      await keep(response.clone());
    }
    return response;
  });
  const slow = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS)).then(
    async () => (await copy()) ?? network
  );
  try {
    return await Promise.race([network, slow]);
  } catch {
    // no network: the copy, else the browser's own error
    return (await copy()) ?? Response.error();
  }
}

registerRoute(
  new NavigationRoute(
    async ({ request }) => {
      const cache = await caches.open(SHELL_CACHE);
      return networkFirst(
        request,
        () => cache.match(SHELL_KEY),
        (response) => cache.put(SHELL_KEY, response)
      );
    },
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
