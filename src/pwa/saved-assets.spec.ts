// The images and tiles of the documents saved offline, in a cache that never expires
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteLegacyCaches,
  keepAssets,
  keptAsset,
  LEGACY_IMAGES_CACHE,
  LEGACY_TILES_CACHE,
  migrateLegacyAssets,
  missingAssets,
  releaseAssets,
  SAVED_ASSETS_CACHE,
} from './saved-assets';
import { fakeCacheStorage } from './test-utils';

const IMAGE = 'https://media.camptocamp.org/c2corg-active/123MI.avif';
const TILE_A = 'https://a.tile.opentopomap.org/13/4247/2905.png';
const TILE_B = 'https://b.tile.opentopomap.org/13/4247/2905.png';
const BROKEN = 'https://media.camptocamp.org/c2corg-active/broken.jpg';

let storage: ReturnType<typeof fakeCacheStorage>;

describe('saved assets', () => {
  beforeEach(() => {
    storage = fakeCacheStorage();
    vi.stubGlobal('caches', storage.caches);
    // every file weighs as many bytes as its url has characters, but the broken one
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url.includes('broken') ? new Response('', { status: 404 }) : new Response(url)))
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('downloads each file once, under one key per tile, and says what they weigh', async () => {
    const kept = await keepAssets([IMAGE, TILE_B, TILE_A, BROKEN]);

    expect(kept.keys.sort()).toEqual([TILE_A, IMAGE].sort());
    expect(kept.bytes).toBe(IMAGE.length + TILE_A.length);
    expect(kept.failed).toBe(1);
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual([TILE_A, IMAGE].sort());
    // with CORS, from the network, and the service worker leaves these requests alone
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenCalledWith(IMAGE, { credentials: 'omit', cache: 'reload' });
  });

  it('counts a file the network did not answer as failed', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
    expect(await keepAssets([IMAGE])).toEqual({ keys: [], bytes: 0, failed: 1 });
  });

  it('removes only the files no saved document uses', async () => {
    await keepAssets([IMAGE, TILE_A]);
    await releaseAssets([IMAGE, TILE_A], new Set([TILE_A]));
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual([TILE_A]);
  });

  it('answers a file from its cache, else from the former ones, whatever the tile server', async () => {
    storage.put(SAVED_ASSETS_CACHE, IMAGE, 'saved');
    // a tile kept before the one key, under the letter b
    storage.put(LEGACY_TILES_CACHE, TILE_B, 'former tile');
    storage.put(LEGACY_IMAGES_CACHE, BROKEN, 'former image');

    expect(await (await keptAsset(IMAGE))?.text()).toBe('saved');
    expect(await (await keptAsset('https://c.tile.opentopomap.org/13/4247/2905.png'))?.text()).toBe('former tile');
    expect(await (await keptAsset(BROKEN))?.text()).toBe('former image');
    expect(await keptAsset('https://a.tile.opentopomap.org/1/0/0.png')).toBeUndefined();
  });

  it('answers nothing without the Cache API', async () => {
    vi.stubGlobal('caches', undefined);
    expect(await keptAsset(IMAGE)).toBeUndefined();
  });

  it('copies the files of a document saved before from the former caches, the missing ones failed', async () => {
    storage.put(LEGACY_IMAGES_CACHE, IMAGE, 'image');
    storage.put(LEGACY_TILES_CACHE, TILE_B, 'tile');

    const kept = await migrateLegacyAssets([IMAGE, TILE_A, BROKEN]);

    expect(kept).toEqual({ keys: [IMAGE, TILE_A], bytes: 'image'.length + 'tile'.length, failed: 1 });
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual([TILE_A, IMAGE].sort());
    expect(fetch).not.toHaveBeenCalled();

    await deleteLegacyCaches();
    expect([...storage.stores.keys()]).toEqual([SAVED_ASSETS_CACHE]);
  });

  it('counts the files the cache no longer holds', async () => {
    await keepAssets([IMAGE, TILE_A]);
    expect(await missingAssets([IMAGE, TILE_A])).toBe(0);
    await releaseAssets([IMAGE], new Set());
    expect(await missingAssets([IMAGE, TILE_A])).toBe(1);
  });
});
