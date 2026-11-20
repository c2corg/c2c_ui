// The images and map tiles of the documents saved offline (offline-store.ts), in a cache of their own that never
// expires: a file goes when the last document that uses it goes. The pages download them (src/stores/offline.ts), the
// service worker answers the <img> and the tiles of the maps from it (service-worker.ts).
// Imports nothing that needs a window: the service worker loads it
import { formerTileKeys, tileCacheKey } from '@/pwa/tile-key';

export const SAVED_ASSETS_CACHE = 'c2c-saved-assets';

// Where the service worker kept them before (17/11/2026 to the release of this file): caches that expired after 90 days
// or when full, oldest first, whatever document needed them. Copied once to the cache above (migrateLegacyAssets), then
// removed
// ponytail: remove LEGACY_* and migrateLegacyAssets after 2027-02-20, when nothing in them can have been kept
export const LEGACY_IMAGES_CACHE = 'c2c-images';
export const LEGACY_TILES_CACHE = 'c2c-map-tiles';

// one key per file: the tiles under one server letter (tile-key.ts), the images at their url
export const assetKey = tileCacheKey;

// a file of the cache above, else of the former caches; undefined without one or without the Cache API
export async function keptAsset(url: string): Promise<Response | undefined> {
  const key = assetKey(url);
  try {
    return (
      (await caches.match(key, { cacheName: SAVED_ASSETS_CACHE })) ??
      (await caches.match(key, { cacheName: LEGACY_IMAGES_CACHE })) ??
      (await caches.match(key, { cacheName: LEGACY_TILES_CACHE })) ??
      (await firstMatch(formerTileKeys(key), LEGACY_TILES_CACHE))
    );
  } catch {
    return undefined;
  }
}

async function firstMatch(keys: string[], cacheName: string) {
  for (const key of keys) {
    const response = await caches.match(key, { cacheName });
    if (response) {
      return response;
    }
  }
  return undefined;
}

export interface KeptAssets {
  // the keys of the files kept, and what they weigh
  keys: string[];
  bytes: number;
  failed: number;
}

// what a phone downloads at once without waiting on each file in turn
const PARALLEL_REQUESTS = 6;

/** Downloads the urls into the cache, PARALLEL_REQUESTS at a time. */
export async function keepAssets(urls: string[]): Promise<KeptAssets> {
  const cache = await caches.open(SAVED_ASSETS_CACHE);
  const result: KeptAssets = { keys: [], bytes: 0, failed: 0 };
  const queue = [...new Set(urls.map(assetKey))];
  const worker = async () => {
    for (let key = queue.shift(); key !== undefined; key = queue.shift()) {
      try {
        // With CORS, a copy the page can read and that the browser counts at its size (an opaque one counts several MB).
        // From the network: the copy of the HTTP cache of an image the page showed came without CORS headers.
        // cache: 'reload' also tells the service worker to leave the request alone (service-worker.ts)
        const response = await fetch(key, { credentials: 'omit', cache: 'reload' });
        if (!response.ok) {
          throw new Error(String(response.status));
        }
        const bytes = (await response.clone().blob()).size;
        await cache.put(key, response);
        result.keys.push(key);
        result.bytes += bytes;
      } catch {
        result.failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_REQUESTS, queue.length) }, worker));
  return result;
}

/** Removes the files of the keys that no saved document uses any more. */
export async function releaseAssets(keys: string[], stillUsed: Set<string>) {
  const unused = keys.filter((key) => !stillUsed.has(key));
  if (!unused.length) {
    return;
  }
  const cache = await caches.open(SAVED_ASSETS_CACHE);
  await Promise.all(unused.map((key) => cache.delete(key)));
}

/**
 * Copies the files of the urls from the former caches to the cache above, for a document saved before it existed. The
 * files they no longer hold count as failed: the document says it is incomplete, and can be downloaded again.
 */
export async function migrateLegacyAssets(urls: string[]): Promise<KeptAssets> {
  const cache = await caches.open(SAVED_ASSETS_CACHE);
  const result: KeptAssets = { keys: [], bytes: 0, failed: 0 };
  for (const key of new Set(urls.map(assetKey))) {
    const response = await keptAsset(key);
    if (!response?.ok) {
      result.failed++;
      continue;
    }
    result.bytes += (await response.clone().blob()).size;
    await cache.put(key, response);
    result.keys.push(key);
  }
  return result;
}

/** How many of the keys the cache no longer holds. */
export async function missingAssets(keys: string[]) {
  const cache = await caches.open(SAVED_ASSETS_CACHE);
  let missing = 0;
  for (const key of keys) {
    if (!(await cache.match(key))) {
      missing++;
    }
  }
  return missing;
}

export async function deleteLegacyCaches() {
  await Promise.all([caches.delete(LEGACY_IMAGES_CACHE), caches.delete(LEGACY_TILES_CACHE)]);
}
