/* eslint-disable no-console */
const addRessourcesToCache = async (ressources) => {
  const cache = await caches.open('v1');
  await cache.addAll(ressources);
};

const putInCache = async ({ request, response }) => {
  const cache = await caches.open('v1');
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    console.info(preloadResponse);
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }
  try {
    const responseFromNetwork = await fetch(request);
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return new Response('Network error happened');
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    addRessourcesToCache([
      './public/favicon.png',
      './public/favicon.png',
      './src/App.vue',
      './src/main.js',
      './component/OutingView.vue',
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWidth(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
      fallbackUrl: './src/App.vue',
    })
  );
});
