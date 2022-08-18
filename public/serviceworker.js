/* eslint-disable no-console */
const CacheName = 'CampToCamp';
const Offline_page = './index.html';

self.addEventListener('fetch', function (event) {
  if (event.request.url.includes('/OutingViews/')) {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          const cache = await caches.open(CacheName);
          const cachedResponse = await cache.match(Offline_page);
          return cachedResponse;
        }
      })()
    );
  }
});

const delay = (ms) => (_) => new Promise((resolve) => setTimeout(() => resolve(_), ms));
function update(request) {
  return fetch(request.url).then(delay(3000).then((response) => response));
}

function refresh(response) {
  return (
    response.json().then((jsonResponse) => {
      self.client.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage(
            JSON.stringify({
              type: response.url,
              data: jsonResponse.data,
            })
          );
        });
      });
      return jsonResponse.data;
    }),
    (navigator.serviceWorker.message = (event) => {
      const message = JSON.parse(event.data);
      if (message && message.type.includes('/views/documents/OutingView')) {
        renderAttendees(message.data);
      }
    })
  );
}
