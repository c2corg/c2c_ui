import { entries, get, set } from 'idb-keyval';
import { createHandlerBoundToURL, getCacheKeyForURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';

const networkTimeoutSeconds = 10; // in seconds, before defaulting to cache if available
const defaultImage = '/img/broken_image.png';

const config = CAMPTOCAMP_CONFIG;

let bucketName = 'c2corg-active';
if (location.hostname === 'www.demov6.camptocamp.org') {
  config.urls = config.urlsConfigurations['prod'];
  // bucketName = 'c2corg-demov6-active';
}
const apiHostname = new URL(config.urls.api).hostname;
const mediaHostname = new URL(config.urls.media).hostname;
console.log(apiHostname);
console.log(mediaHostname);

const imgRegex = new RegExp(`^\\/${bucketName}\\/(\\d{9,10}_\\d{9,10}(?:BI|MI|SI)?)\\.(?:jpg|png|gif|svg)$`);
const imgProxyPathnameRegex = /^\/images\/proxy\/(\d{1,9})$/;
const imgProxySearchRegex = /^\?size=(BI|MI|SI)$/;
const docPathnameRegex = /^\/(articles|books|images|outings|routes|waypoints|xreports)\/(\d+)$/;
const docSearchRegex = /^\?cook=([a-z]{2})$/;

/**
 * A network first strategy with timeout customized so that the cache storage won't be used, instead relying on
 * IndexedDB.
 */
const strategy = new NetworkFirst({
  networkTimeoutSeconds,
  plugins: [
    {
      handlerWillStart: async ({ request }) => {
        console.log('handler will start: ' + request.url);
      },
      handlerDidRespond: async ({ request }) => {
        console.log('handler did respond: ' + request.url);
      },
      handlerDidError: async ({ request }) => {
        console.log('handler did error: ' + request.url);
        return Response.error();
      },
      requestWillFetch: async ({ request }) => {
        console.log('request will fetch: ' + request.url);
        return request;
      },
      fetchDidFail: async ({ request }) => {
        console.log('fetch did fail: ' + request.url);
      },
      fetchDidSucceed: async ({ request, response }) => {
        console.log('fetch did succeed: ' + request.url);
        return response;
      },

      cacheWillUpdate: async ({ request, response }) => {
        console.log('cache will update');
        // update cache if applies
        if (!response || response.status !== 200) {
          console.log('not a valid repsonse, no cache set');
          return;
        }
        const key = await getKey(request);
        if (!key) {
          console.log('no matching key, no cache set');
          return null;
        }
        const data = await get(key);
        if (data) {
          const responseClone = response.clone();
          console.log('set cache');
          await set(key, isBlobData(key) ? await responseClone.blob() : await responseClone.json());
        }
        // do not use "default" caching
        console.log('no matching cache entry, no cache set');
        return null;
      },

      cachedResponseWillBeUsed: async ({ request }) => {
        console.log('cached response will be used: ' + request.url);
        const key = await getKey(request);
        if (!key) {
          // no key, request not handled (although it should not happen if configured properly)
          console.log('no key for request: ' + request.url);
          return null;
        }
        const data = await get(key);
        if (!data) {
          // no cache found
          console.log('no cache found: ' + request.url);
          return null;
        }
        console.log('us cached data: ' + request.url);
        // use cached data
        if (typeof data === 'string' || data instanceof Blob) {
          return new Response(data);
        } else {
          return new Response(JSON.stringify(data));
        }
      },
    },
  ],
});

const getKey = async (request) => {
  const url = new URL(request.url);
  if (isCookedDocumentRequest(url)) {
    const [, type, id] = docPathnameRegex.exec(url.pathname);
    const [, lang] = docSearchRegex.exec(url.search);
    return `${type}/${id}/${lang}`;
  } else if (isMediaRequest(url)) {
    return imgRegex.exec(url.pathname)[1];
  } else if (isImageProxyRequest(url)) {
    const [, id] = imgProxyPathnameRegex.exec(url.pathname);
    const [, size] = imgProxySearchRegex.exec(url.search);
    const imgDoc = (await entries()).find(([key]) => key.startsWith(`images/${id}`));
    if (!imgDoc) {
      // not available in cache anyway, default to network
      return undefined;
    }
    return imgDoc[1].filename.replace('.', `${size}.`).replace(/\.[^/.]+$/, '');
  }
  return undefined;
};

const isCookedDocumentRequest = (url) =>
  url.hostname === apiHostname && url.pathname.match(docPathnameRegex) && url.search.match(docSearchRegex);

const isMediaRequest = (url) => url.hostname === mediaHostname && url.pathname.match(imgRegex);

const isImageProxyRequest = (url) =>
  url.hostname === apiHostname && url.pathname.match(imgProxyPathnameRegex) && url.search.match(imgProxySearchRegex);

const isBlobData = (key) => /^\d+$/.test(key[0]);

precacheAndRoute(self.__WB_MANIFEST);

const handler = createHandlerBoundToURL('/index.html');
registerRoute(
  new NavigationRoute(handler, {
    // static pages not part of SPA
    denylist: [new RegExp('\\/revive\\-adserver.html'), new RegExp('\\/google')],
  })
);
registerRoute(({ url }) => isCookedDocumentRequest(url), strategy);
registerRoute(({ url }) => isMediaRequest(url), strategy);
registerRoute(({ url }) => isImageProxyRequest(url), strategy);
setDefaultHandler(new NetworkOnly());
setCatchHandler(async ({ request }) => {
  switch (request.destination) {
    case 'image':
      return caches
        .match(getCacheKeyForURL(defaultImage))
        .then((response) => response || fetch(defaultImage))
        .catch(() => fetch(defaultImage));
    default:
      // if we don't have a fallback, return an error response.
      return Response.error();
  }
});
