import { entries, get, set } from 'idb-keyval';
import { createHandlerBoundToURL, getCacheKeyForURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';

import { filenames } from '../src/js/image-formats';

const networkTimeoutSeconds = 10; // in seconds, before defaulting to cache if available
const defaultImage = '/img/broken_image.png';

const config = CAMPTOCAMP_CONFIG;

if (location.hostname === 'www.demov6.camptocamp.org') {
  config.urls = config.urlsConfigurations['demo'];
}
const bucketName = new URL(config.urls.media).pathname.substring(1);
const apiHostname = new URL(config.urls.api).hostname;
const mediaHostname = new URL(config.urls.media).hostname;

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
      cacheWillUpdate: async ({ request, response }) => {
        // update cache if applies
        if (!response || response.status !== 200) {
          return;
        }
        const key = await getKey(request);
        if (!key) {
          return null;
        }
        const data = await get(key);
        if (data) {
          updateCache(key, asResponse(data), response.clone());
        }
        // do not use "default" caching
        return null;
      },

      cachedResponseWillBeUsed: async ({ request }) => {
        const key = await getKey(request);
        if (!key) {
          // no key, request not handled (although it should not happen if configured properly)
          return null;
        }
        const data = await get(key);
        if (!data) {
          // no cache found
          return null;
        }
        // use cached data
        return asResponse(data);
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

const asResponse = (data) => {
  if (typeof data === 'string' || data instanceof Blob) {
    return new Response(data);
  } else {
    return new Response(JSON.stringify(data));
  }
};

const updateCache = async (key, previousResponse, newResponse) => {
  const newData = isBlobData(key) ? await newResponse.blob() : await newResponse.json();
  await set(key, newData);
  if (key.startsWith('images')) {
    const previousData = await previousResponse.json();
    const previousFilename = previousData.filename;
    const newFilename = newData.filename;
    if (previousFilename === newFilename) {
      return;
    }
    // update media, because a new version of the image has been published
    for (const filename of filenames(previousData)) {
      del(filename.replace(/\.[^/.]+$/, ''));
    }
    for (const filename of filenames(newData)) {
      fetch(config.urls.media + '/' + filename, {
        cache: 'reload',
      })
        .then((response) => response.blob())
        .then((blob) => set(filename.replace(/\.[^/.]+$/, ''), blob));
    }
  }
};

//
// configure offline strategies
//

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
