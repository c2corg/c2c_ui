import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useOfflineStore } from './offline';

import { listDocuments } from '@/pwa/offline-store';

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
vi.mock('@/components/map/OlMap.vue', () => ({ default: {} }));

describe('offline store', () => {
  beforeEach(async () => {
    await clear();
    setActivePinia(createPinia());
    // every download works but the image
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({ ok: !url.includes('broken') }))
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
    expect(entry.assets).toEqual({ done: true, failed: 1 });
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('opentopomap'))).toBe(true);

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

  it('empties one section, documents and folders', async () => {
    const offline = useOfflineStore();
    const folder = await offline.createFolder('Écrins', 'online');
    await offline.saveDocument({ type: 'route', id: 12, lang: 'fr', title: 'Arête', folderId: folder });
    expect(offline.foldersOf('online')).toHaveLength(1);

    await offline.purge('offline');
    expect(offline.savedDocs).toHaveLength(1);

    await offline.purge('online');
    expect(offline.savedDocs).toEqual([]);
    expect(offline.folders).toEqual([]);
  });

  it('saves the pack of the day: the route and its waypoints offline, in a new folder', async () => {
    const offline = useOfflineStore();
    const saved = await offline.saveDayPack({ id: 12, lang: 'fr', title: 'Arête' }, 'Samedi');
    expect(saved).toBe(2);
    const [folder] = offline.foldersOf('offline');
    expect(folder.name).toBe('Samedi');
    const inPack = offline.savedDocs.filter((entry) => entry.folderId === folder.id);
    expect(inPack.map((entry) => `${entry.type}/${entry.id}/${entry.mode}`).sort()).toEqual([
      'route/12/offline',
      'waypoint/30/offline',
      'waypoint/31/offline',
    ]);
  });
});
