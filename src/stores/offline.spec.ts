import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useOfflineStore } from './offline';

import { tileUrlsOf } from '@/pwa/offline-assets';
import { listDocuments, OFFLINE_MODE, saveDocument as saveEntry, setAssets } from '@/pwa/offline-store';
import { LEGACY_IMAGES_CACHE, LEGACY_TILES_CACHE, SAVED_ASSETS_CACHE } from '@/pwa/saved-assets';
import { fakeCacheStorage } from '@/pwa/test-utils';

// a route with one image in its text and a point: one image and the tiles around the point to download
const getCooked = vi.hoisted(() => async () => ({
  data: {
    document_id: 12,
    cooked: { lang: 'fr', description: '<img src="https://example.org/broken.png">' },
    geometry: { geom: JSON.stringify({ type: 'Point', coordinates: [764280, 5751080] }) },
    // its hut and summit, for the pack of the day
    associations: {
      waypoints: [{ document_id: 30, locales: [{ title: 'Refuge' }] }],
      waypoint_children: [{ document_id: 31, locales: [{ title: 'Sommet' }] }],
    },
  },
}));
const getWaypoint = vi.hoisted(() => async (id: number) => ({ data: { document_id: id, cooked: { lang: 'fr' } } }));
vi.mock('@/js/apis/c2c', () => ({
  default: { getApiLang: (lang: string) => lang, route: { getCooked }, waypoint: { getCooked: getWaypoint } },
}));

// the code of the pages, loaded for later
const routeView = vi.hoisted(() => vi.fn(async () => ({})));
const offlineView = vi.hoisted(() => vi.fn(async () => ({})));
const outingForm = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock('@/js/vue-plugins/router', () => ({
  default: {
    getRoutes: () => [
      { name: 'route', components: { default: routeView } },
      { name: 'offline', components: { default: offlineView } },
      { name: 'waypoint', components: { default: vi.fn() } },
      { name: 'outing-add', components: { default: outingForm } },
    ],
  },
}));
vi.mock('@/components/map/C2cMap.vue', () => ({ default: {} }));
vi.mock('@/components/map/OlMap.vue', () => ({ default: {} }));
// the page of the app, kept for the offline starts
const keepShell = vi.hoisted(() => vi.fn(async () => true));
vi.mock('@/pwa/shell', () => ({ keepShell }));

const POINT = { geom: JSON.stringify({ type: 'Point', coordinates: [764280, 5751080] }) };

let storage: ReturnType<typeof fakeCacheStorage>;

describe('offline store', () => {
  beforeEach(async () => {
    await clear();
    setActivePinia(createPinia());
    storage = fakeCacheStorage();
    vi.stubGlobal('caches', storage.caches);
    // every download works but the image; a file weighs 10 bytes
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('broken') ? new Response('', { status: 404 }) : new Response('0123456789')
      )
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('bookmarks a document, then takes it offline with its images and tiles', async () => {
    const offline = useOfflineStore();
    const route = { type: 'route', id: 12, lang: 'fr', title: 'Arête des Cosmiques' };

    await offline.saveDocument(route);
    expect(offline.isSaved('route', 12)).toBe(true);
    expect(offline.isOfflineReady('route', 12)).toBe(false);

    const saving = offline.downloadForOffline(offline.find('route', 12)!);
    expect(offline.isDownloading('route', 12)).toBe(true);
    await saving;
    expect(offline.isDownloading('route', 12)).toBe(false);
    expect(offline.isOfflineReady('route', 12)).toBe(true);
    await vi.waitFor(() => expect(routeView).toHaveBeenCalled());
    expect(offlineView).toHaveBeenCalled();
    expect(outingForm).toHaveBeenCalled();

    const [entry] = await listDocuments();
    expect(entry.data.document_id).toBe(12);
    // the image did not arrive: the download is not complete
    expect(entry.assets).toMatchObject({ done: true, failed: 1 });
    // the tiles around the point are kept, with what they and the document weigh
    const tiles = tileUrlsOf(POINT);
    expect(entry.assets?.keys?.sort()).toEqual([...tiles].sort());
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual([...tiles].sort());
    expect(entry.assets?.bytes).toBe(tiles.length * 10 + new Blob([JSON.stringify(entry.data)]).size);

    // bookmarking it again keeps the offline copy
    await offline.saveDocument(route);
    expect(offline.isOfflineReady('route', 12)).toBe(true);
  });

  it('says a copy complete only with the code of its pages, which may be wanted at once offline', async () => {
    const offline = useOfflineStore();
    let loaded = () => {};
    routeView.mockImplementationOnce(() => new Promise((resolve) => (loaded = () => resolve({}))));
    await offline.saveDocument({ type: 'route', id: 12, lang: 'fr', title: 'Arête' });

    const saving = offline.downloadForOffline(offline.find('route', 12)!);
    // the images and the tiles are there, the code of the route page is still loading: the copy is not complete
    await vi.waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(offline.isDownloading('route', 12)).toBe(true);
    expect((await listDocuments())[0].assets?.done).toBe(false);

    loaded();
    await saving;
    expect(offline.isDownloading('route', 12)).toBe(false);
    expect((await listDocuments())[0].assets?.done).toBe(true);
  });

  it('says a copy incomplete while the page of the app is not kept, which starts it offline', async () => {
    const offline = useOfflineStore();
    keepShell.mockResolvedValueOnce(false);
    await offline.saveDocument({ type: 'route', id: 12, lang: 'fr', title: 'Arête' });

    await offline.downloadForOffline(offline.find('route', 12)!);
    // the image does not arrive (see beforeEach), and the page of the app was not kept
    expect((await listDocuments())[0].assets).toMatchObject({ done: true, failed: 2 });
  });

  it('frees the files of a topo removed or back to online, but the ones another topo uses', async () => {
    const offline = useOfflineStore();
    // two routes around the same point: the same tiles
    for (const id of [12, 13]) {
      await offline.saveDocument({ type: 'route', id, lang: 'fr', title: 'Arête', mode: OFFLINE_MODE });
    }
    const tiles = [...tileUrlsOf(POINT)].sort();

    await offline.removeDocument('route', 12);
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual(tiles);

    await offline.makeOnline('route', 13);
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual([]);
    expect(offline.find('route', 13)?.assets).toBeUndefined();
  });

  it('keeps the files of a topo downloaded again, and frees the ones its new copy does not use', async () => {
    const offline = useOfflineStore();
    await offline.saveDocument({ type: 'route', id: 12, lang: 'fr', title: 'Arête', mode: OFFLINE_MODE });
    // a file of a former copy, which the new one no longer has
    const former = 'https://a.tile.opentopomap.org/11/1/1.png';
    storage.put(SAVED_ASSETS_CACHE, former, 'old');
    await setAssets('route', 12, {
      done: true,
      failed: 0,
      keys: [...offline.find('route', 12)!.assets!.keys!, former],
    });
    await offline.refresh();

    await offline.downloadForOffline(offline.find('route', 12)!);
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual([...tileUrlsOf(POINT)].sort());
  });

  it('moves the files of the topos saved before to their cache, and removes the former caches', async () => {
    // a topo saved offline before: its document, no list of its files, one of its tiles in the former cache (under
    // the letter b), its image nowhere
    const data = {
      document_id: 12,
      cooked: { description: '<img src="https://example.org/lost.png">' },
      geometry: POINT,
    };
    await saveEntry({ type: 'route', id: 12, lang: 'fr', data, title: 'Arête', folderId: null, mode: OFFLINE_MODE });
    await setAssets('route', 12, { done: true, failed: 0 });
    const [tile, ...others] = tileUrlsOf(POINT);
    storage.put(LEGACY_TILES_CACHE, tile.replace('https://a.', 'https://b.'), '0123456789');
    // and a file of a topo removed since
    storage.put(LEGACY_IMAGES_CACHE, 'https://example.org/gone.png', 'gone');

    const offline = useOfflineStore();
    await vi.waitFor(() => expect(offline.find('route', 12)?.assets?.keys).toEqual([tile]));

    expect(offline.find('route', 12)?.assets).toMatchObject({
      done: true,
      // the image and the other tiles were not there any more
      failed: others.length + 1,
      bytes: 10 + new Blob([JSON.stringify(data)]).size,
    });
    expect([...storage.stores.keys()]).toEqual([SAVED_ASSETS_CACHE]);
    expect(storage.keysOf(SAVED_ASSETS_CACHE)).toEqual([tile]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps a favourite without its content, with no network, in its folder', async () => {
    const offline = useOfflineStore();
    const folder = await offline.createFolder('Écrins');
    await offline.bookmark({ type: 'route', id: 12, lang: 'fr', title: 'Arête', folderId: folder });
    expect(fetch).not.toHaveBeenCalled();
    expect(offline.find('route', 12)).toMatchObject({ mode: 'online', data: null, folderId: folder });

    // taken offline, then back to a favourite only: still in its folder
    await offline.downloadForOffline(offline.find('route', 12)!);
    expect(offline.find('route', 12)).toMatchObject({ mode: 'offline', folderId: folder });
    await offline.makeOnline('route', 12);
    expect(offline.find('route', 12)).toMatchObject({ mode: 'online', folderId: folder });
  });

  it('makes one folder of the folders of the same name of the former two sections', async () => {
    const offline = useOfflineStore();
    const online = await offline.createFolder('Écrins', 'online');
    const offlineFolder = await offline.createFolder('écrins ', 'offline');
    await offline.createFolder('Vanoise', 'offline');
    await saveEntry({
      type: 'route',
      id: 12,
      lang: 'fr',
      data: { document_id: 12 },
      title: 'Arête',
      folderId: offlineFolder,
      mode: OFFLINE_MODE,
    });
    await offline.refresh();

    await offline.mergeFoldersByName();
    expect(offline.folders.map((folder) => folder.name).sort()).toEqual(['Vanoise', 'Écrins']);
    expect(offline.find('route', 12)?.folderId).toBe(online);
  });

  it('finds the files the browser cleared, and lists the copies to download again, the most urgent first', async () => {
    const offline = useOfflineStore();
    await offline.ready;
    for (const id of [12, 13]) {
      await offline.saveDocument({ type: 'route', id, lang: 'fr', title: 'Arête', mode: OFFLINE_MODE });
    }
    // the image of the text does not arrive (see beforeEach): both copies are incomplete. Say the other files arrived
    for (const id of [12, 13]) {
      const { keys, bytes } = offline.find('route', id)!.assets!;
      await setAssets('route', id, { done: true, failed: 0, keys: [...keys!], bytes });
    }
    await offline.refresh();
    expect(offline.needingAttention).toEqual([]);

    // the browser cleared one tile, shared by both
    const [tile] = storage.keysOf(SAVED_ASSETS_CACHE);
    storage.stores.get(SAVED_ASSETS_CACHE)!.delete(tile);
    await offline.checkAssets();

    expect(offline.find('route', 12)?.assets?.missing).toBe(1);
    expect(offline.needingAttention.map(({ entry, attention }) => `${entry.id}:${attention}`)).toEqual([
      '12:incomplete',
      '13:incomplete',
    ]);
  });
});
