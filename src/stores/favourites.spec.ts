import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import { useFavouritesStore } from './favourites';
import { useOfflineStore } from './offline';

import { readList, readPending } from '@/pwa/favourites-cache';
import { OFFLINE_MODE, saveDocument as saveEntry, saveFolder } from '@/pwa/offline-store';
import { fakeCacheStorage } from '@/pwa/test-utils';

// the user: logged out unless a test logs in
const user = vi.hoisted(() => ({ state: null as unknown as { isLogged: boolean; id: number | null } }));
vi.mock('@/stores/user', () => ({ useUserStore: () => user.state }));
vi.mock('@/stores/language', () => ({ useLanguageStore: () => ({ current: 'fr' }) }));

// the API of the favourites, and the documents downloaded for offline
const api = vi.hoisted(() => ({
  list: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  move: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  deleteFolder: vi.fn(),
}));
const getCooked = vi.hoisted(() => async (id: number) => ({
  data: {
    document_id: id,
    cooked: { lang: 'fr' },
    associations: {
      waypoints: [{ document_id: 30, locales: [{ title: 'Refuge' }] }],
      waypoint_children: [{ document_id: 31, locales: [{ title: 'Sommet' }] }],
    },
  },
}));
vi.mock('@/js/apis/c2c', () => ({
  default: {
    getApiLang: (lang: string) => lang,
    favourites: api,
    route: { getCooked },
    waypoint: { getCooked },
    outing: { getCooked },
  },
}));
vi.mock('@/js/vue-plugins/router', () => ({ default: { getRoutes: () => [] } }));
vi.mock('@/components/map/C2cMap.vue', () => ({ default: {} }));
vi.mock('@/components/map/OlMap.vue', () => ({ default: {} }));
vi.mock('@/pwa/shell', () => ({ keepShell: async () => true }));

const ok = (data: unknown = {}) => Promise.resolve({ data });
// no answer: no network
const networkError = () => Promise.reject(new Error('Network Error'));

const ROUTE = { type: 'route', id: 12, lang: 'fr', title: 'Arête des Cosmiques' };

// the account: one route in folder 5, one waypoint without folder
const accountList = () => ({
  favourites: [
    {
      document_id: 12,
      type: 'r',
      folder_id: 5,
      created_at: '2026-11-20T10:00:00Z',
      lang: 'fr',
      title: 'Arête des Cosmiques',
      title_prefix: 'Aiguille du Midi',
    },
    { document_id: 40, type: 'w', folder_id: null, created_at: '2026-11-21T10:00:00Z', lang: 'fr', title: 'Refuge' },
  ],
  folders: [{ id: 5, name: 'Mont Blanc', position: 0, created_at: '2026-11-20T10:00:00Z' }],
});

async function startStore() {
  const favourites = useFavouritesStore();
  await favourites.whenReady();
  return favourites;
}

describe('favourites store', () => {
  beforeEach(async () => {
    await clear();
    setActivePinia(createPinia());
    user.state = reactive({ isLogged: false, id: null });
    vi.resetAllMocks();
    api.list.mockImplementation(() => ok(accountList()));
    api.add.mockImplementation(() => ok());
    api.remove.mockImplementation(() => ok());
    api.move.mockImplementation(() => ok());
    api.createFolder.mockImplementation((name: string) =>
      ok({ id: 100 + api.createFolder.mock.calls.length, name, position: 1, created_at: '' })
    );
    vi.stubGlobal('caches', fakeCacheStorage().caches);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('0123456789'))
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  describe('logged out: on the device', () => {
    it('adds, moves and removes a favourite without the API', async () => {
      const favourites = await startStore();
      const folder = await favourites.createFolder('Écrins');

      await favourites.add(ROUTE);
      expect(favourites.isFavourite('route', 12)).toBe(true);
      await favourites.move('route', 12, folder);
      expect(favourites.find('route', 12)?.folderId).toBe(folder);
      expect(favourites.folders).toEqual([{ id: folder, name: 'Écrins' }]);

      await favourites.remove('route', 12);
      expect(favourites.isFavourite('route', 12)).toBe(false);
      expect(api.add).not.toHaveBeenCalled();
      expect(api.list).not.toHaveBeenCalled();
    });

    it('keeps the favourite when its offline copy is removed', async () => {
      const favourites = await startStore();
      const offline = useOfflineStore();

      await favourites.saveOffline(ROUTE);
      expect(favourites.isFavourite('route', 12)).toBe(true);
      expect(offline.isOfflineReady('route', 12)).toBe(true);

      await favourites.removeOfflineCopy('route', 12);
      expect(offline.isOfflineReady('route', 12)).toBe(false);
      expect(favourites.isFavourite('route', 12)).toBe(true);
    });
  });

  describe('logged in: on the account', () => {
    beforeEach(() => {
      user.state.isLogged = true;
      user.state.id = 7;
    });

    it('reads the list of the account, with the document types of the UI, and keeps it for no network', async () => {
      const favourites = await startStore();

      expect(api.list).toHaveBeenCalledWith('fr');
      expect(favourites.favourites).toEqual([
        { type: 'waypoint', id: 40, title: 'Refuge', lang: 'fr', folderId: null, createdAt: expect.any(Number) },
        {
          type: 'route',
          id: 12,
          title: 'Aiguille du Midi : Arête des Cosmiques',
          lang: 'fr',
          folderId: '5',
          createdAt: expect.any(Number),
        },
      ]);
      expect(favourites.folders).toEqual([{ id: '5', name: 'Mont Blanc' }]);
      expect((await readList(7))?.favourites).toHaveLength(2);

      // started again without a network: the list kept
      setActivePinia(createPinia());
      useOfflineStore().online = false;
      api.list.mockClear();
      const again = await startStore();
      expect(api.list).not.toHaveBeenCalled();
      expect(again.isFavourite('route', 12)).toBe(true);
    });

    it('sends add, move and remove to the API, by document id and folder id', async () => {
      const favourites = await startStore();

      await favourites.add({ type: 'outing', id: 50, lang: 'fr', title: 'Sortie' }, '5');
      expect(api.add).toHaveBeenCalledWith(50, 5);
      expect(favourites.find('outing', 50)).toMatchObject({ title: 'Sortie', folderId: '5' });

      await favourites.move('outing', 50, null);
      expect(api.move).toHaveBeenCalledWith(50, null);
      expect(favourites.find('outing', 50)?.folderId).toBeNull();

      await favourites.remove('outing', 50);
      expect(api.remove).toHaveBeenCalledWith(50);
      expect(favourites.isFavourite('outing', 50)).toBe(false);
    });

    it('queues the changes made without a network, and sends them when it is back', async () => {
      const favourites = await startStore();
      const offline = useOfflineStore();
      offline.online = false;

      await favourites.add({ type: 'book', id: 60, lang: 'fr', title: 'Livre' });
      await favourites.remove('route', 12);
      expect(api.add).not.toHaveBeenCalled();
      expect(favourites.isFavourite('book', 60)).toBe(true);
      expect(favourites.isFavourite('route', 12)).toBe(false);
      expect(favourites.pendingCount).toBe(2);
      expect(await readPending(7)).toHaveLength(2);

      // the network comes back while the list of the account does not have them yet
      offline.online = true;
      await vi.waitFor(() => expect(favourites.pendingCount).toBe(0));
      expect(api.add).toHaveBeenCalledWith(60, null);
      expect(api.remove).toHaveBeenCalledWith(12);
      await vi.waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
    });

    it('keeps a change in the queue when the network fails while it is sent', async () => {
      const favourites = await startStore();
      api.add.mockImplementationOnce(networkError);

      await favourites.add({ type: 'book', id: 60, lang: 'fr', title: 'Livre' });
      expect(favourites.isFavourite('book', 60)).toBe(true);
      expect(favourites.pendingCount).toBe(1);
    });

    it('sends the favourites of the device to the account once, their folders by name', async () => {
      // logged out before: a favourite in a folder, an offline copy in a folder of the same name (former sections),
      // a folder the account already has, and an empty one
      await saveFolder({ id: 'a', name: 'Écrins', section: 'online' });
      await saveFolder({ id: 'b', name: 'écrins', section: 'offline' });
      await saveFolder({ id: 'c', name: 'Mont Blanc', section: 'online' });
      await saveFolder({ id: 'd', name: 'Vide', section: 'online' });
      await saveEntry({ ...ROUTE, id: 70, data: null, folderId: 'a', mode: 'online' });
      await saveEntry({ ...ROUTE, id: 71, data: { document_id: 71 }, folderId: 'b', mode: OFFLINE_MODE });
      await saveEntry({ ...ROUTE, id: 72, data: null, folderId: 'c', mode: 'online' });

      const favourites = await startStore();
      const offline = useOfflineStore();

      expect(api.createFolder.mock.calls.map(([name]) => name)).toEqual(['Écrins', 'Vide']);
      expect(api.add).toHaveBeenCalledWith(70, 101);
      expect(api.add).toHaveBeenCalledWith(71, 101);
      expect(api.add).toHaveBeenCalledWith(72, 5);
      // the favourites without a copy leave the device, the offline copy stays
      expect(offline.savedDocs.map((entry) => entry.id)).toEqual([71]);
      expect(favourites.find('route', 71)?.folderId).toBe('101');
      expect(favourites.folders.map((folder) => folder.name)).toEqual(['Mont Blanc', 'Écrins', 'Vide']);

      // the next start: nothing sent again
      setActivePinia(createPinia());
      api.createFolder.mockClear();
      api.add.mockClear();
      api.list.mockImplementation(() =>
        ok({
          ...accountList(),
          favourites: [
            ...accountList().favourites,
            { document_id: 71, type: 'r', folder_id: 101, created_at: '', lang: 'fr', title: 'x' },
          ],
        })
      );
      await startStore();
      expect(api.createFolder).not.toHaveBeenCalled();
      expect(api.add).not.toHaveBeenCalled();
    });

    it('removes the offline copy with the favourite, and keeps the favourite without its copy', async () => {
      const favourites = await startStore();
      const offline = useOfflineStore();

      await favourites.saveOffline({ type: 'outing', id: 50, lang: 'fr', title: 'Sortie' });
      expect(api.add).toHaveBeenCalledWith(50, null);
      expect(offline.isOfflineReady('outing', 50)).toBe(true);

      await favourites.removeOfflineCopy('outing', 50);
      expect(offline.find('outing', 50)).toBeUndefined();
      expect(favourites.isFavourite('outing', 50)).toBe(true);

      await favourites.saveOffline({ type: 'outing', id: 50, lang: 'fr', title: 'Sortie' });
      await favourites.remove('outing', 50);
      expect(offline.find('outing', 50)).toBeUndefined();
      expect(favourites.isFavourite('outing', 50)).toBe(false);
    });

    it('saves the pack of the day in a new folder of the account', async () => {
      const favourites = await startStore();
      const offline = useOfflineStore();

      const saved = await favourites.saveDayPack({ id: 12, lang: 'fr', title: 'Arête' }, 'Samedi');
      expect(saved).toBe(2);
      expect(api.createFolder).toHaveBeenCalledWith('Samedi');
      // the route was a favourite in another folder: moved to the pack
      expect(api.add).toHaveBeenCalledWith(12, 101);
      expect(api.add).toHaveBeenCalledWith(30, 101);
      expect(api.add).toHaveBeenCalledWith(31, 101);
      expect(offline.savedDocs.map((entry) => `${entry.type}/${entry.id}`).sort()).toEqual([
        'route/12',
        'waypoint/30',
        'waypoint/31',
      ]);
    });
  });
});
