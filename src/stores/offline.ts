// "My topos" (src/pwa/offline-store.ts) as the pages show them, the downloads for offline, and whether the network is
// there
import { defineStore } from 'pinia';
import { ref } from 'vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import config from '@/js/config';
import { imageUrlsOf, tileUrlsOf } from '@/pwa/offline-assets';
import * as idb from '@/pwa/offline-store';
import {
  isOfflineEntry,
  OFFLINE_MODE,
  ONLINE_MODE,
  type Folder,
  type SavedEntry,
  type SavedMode,
} from '@/pwa/offline-store';
import { assetKey, deleteLegacyCaches, keepAssets, migrateLegacyAssets, releaseAssets } from '@/pwa/saved-assets';
import { keepShell } from '@/pwa/shell';

// the images of a document and the map tiles around it
const assetUrlsOf = (data: SavedEntry['data']) => [...imageUrlsOf(data), ...tileUrlsOf(data?.geometry)];
// what the copy of the document itself weighs
const sizeOf = (data: unknown) => new Blob([JSON.stringify(data)]).size;

// The code of the pages that show a document without a network: its view, "My topos" and the map load on first use,
// and may never have been opened. Loaded now, the service worker keeps them. The router is imported here and not at
// the top: it imports the views, which use this store
async function loadPagesOf(type: string) {
  const { default: router } = await import('@/js/vue-plugins/router');
  const views = router
    .getRoutes()
    // and the outing form: the outing of a topo is written in the mountains
    .filter((route) => [type, 'offline', 'outing-add'].includes(String(route.name)))
    .map((route) => route.components?.default)
    .filter((view): view is () => Promise<unknown> => typeof view === 'function');
  // the map of the pages (MapLibre), and the one of the outing form (OpenLayers)
  await Promise.all([
    import('@/components/map/C2cMap.vue'),
    import('@/components/map/OlMap.vue'),
    ...views.map((view) => view()),
  ]);
}

// The browser says it is offline on some phones that still have a network: a request to the API decides
async function apiReachable() {
  try {
    await fetch(`${config.urls.api}/health`, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(4000) });
    return true;
  } catch {
    return false;
  }
}

export const useOfflineStore = defineStore('offline', () => {
  const online = ref(navigator.onLine !== false);
  const savedDocs = ref<SavedEntry[]>([]);
  const folders = ref<Folder[]>([]);
  // type/id of the documents being saved
  const downloading = ref(new Set<string>());

  let recheck: number | undefined;
  async function checkConnection() {
    window.clearTimeout(recheck);
    online.value = await apiReachable();
    if (!online.value) {
      recheck = window.setTimeout(checkConnection, 15000);
    }
  }
  window.addEventListener('online', () => {
    window.clearTimeout(recheck);
    online.value = true;
  });
  window.addEventListener('offline', checkConnection);
  if (!online.value) {
    void checkConnection();
  }

  async function refresh() {
    [savedDocs.value, folders.value] = await Promise.all([idb.listDocuments(), idb.listFolders()]);
  }
  // The files of the downloads in progress: a document removed meanwhile must not take the ones they share
  const downloadingKeys = new Set<Set<string>>();
  function keysInUse() {
    const used = new Set<string>();
    for (const entry of savedDocs.value) {
      if (entry.mode === OFFLINE_MODE) {
        entry.assets?.keys?.forEach((key) => used.add(key));
      }
    }
    downloadingKeys.forEach((keys) => keys.forEach((key) => used.add(key)));
    return used;
  }

  // after a change of the saved documents: the files of keys that none of them uses any more go
  async function release(keys?: string[]) {
    await refresh();
    if (keys?.length) {
      await releaseAssets(keys, keysInUse()).catch(() => {});
    }
  }

  // The documents saved offline before the cache of saved-assets.ts: their files copied there from the former caches,
  // once, then those caches removed (with the files of the documents removed since, which nothing would remove)
  async function migrateLegacy() {
    const legacy = savedDocs.value.filter(
      (entry) =>
        isOfflineEntry(entry) &&
        !entry.assets?.keys &&
        // a download in progress, or one stopped halfway (the tab closed): its files are not in the former caches
        entry.assets?.done !== false &&
        !isDownloading(entry.type, entry.id)
    );
    for (const entry of legacy) {
      const kept = await migrateLegacyAssets(assetUrlsOf(entry.data));
      await idb.setAssets(entry.type, entry.id, {
        done: true,
        // what failed before may be the code of the pages, which this does not check
        failed: Math.max(kept.failed, entry.assets?.failed ?? 0),
        keys: kept.keys,
        bytes: kept.bytes + sizeOf(entry.data),
      });
    }
    await deleteLegacyCaches();
    if (legacy.length) {
      await refresh();
    }
  }

  // no IndexedDB (a private window of an old browser): no saved documents. No Cache API: nothing to migrate
  refresh()
    .then(migrateLegacy)
    .catch(() => {});

  const find = (type: string, id: number) => savedDocs.value.find((entry) => entry.type === type && entry.id === id);
  const isDownloading = (type: string, id: number) => downloading.value.has(`${type}/${id}`);

  async function saveDocument(args: {
    type: string;
    id: number;
    lang: string;
    title: string;
    folderId?: string | null;
    mode?: SavedMode;
  }) {
    const { type, id, title, folderId = null, mode = ONLINE_MODE } = args;
    const key = `${type}/${id}`;
    // a bookmark of a saved document would drop its offline copy
    if (downloading.value.has(key) || (mode === ONLINE_MODE && find(type, id))) {
      return;
    }
    downloading.value.add(key);
    try {
      // the language of the requests of the page, which the service worker answers from the saved copy
      const lang = c2c.getApiLang(args.lang);
      // whatever its type: kept as the API answered it
      const data: SavedEntry['data'] = (await (c2c[type] as DocumentService).getCooked(id, lang)).data;
      // the files of the copy it replaces, which the new one may not use
      const formerKeys = find(type, id)?.assets?.keys;
      await idb.saveDocument({ type, id, lang, data, title, folderId, mode });
      if (mode === OFFLINE_MODE) {
        // without it, the browser may clear the data of the site when the phone is short of space
        navigator.storage?.persist?.().catch(() => {});
        // the code of its pages too, before the copy is said complete: a phone put offline right after it would not
        // open them (the outing form, in a hut); not loaded, it counts as a failed file
        const pages = loadPagesOf(type).then(
          () => 0,
          () => 1
        );
        await idb.setAssets(type, id, { done: false, failed: 0 });
        await refresh();
        // and the page of the app, to start it offline (src/pwa/shell.ts): the service worker keeps it when it
        // installs, unless there was no network then. Not kept, it counts as a failed file too
        const shell = keepShell(new URL(import.meta.env.BASE_URL, location.origin).href).then(
          (kept) => (kept ? 0 : 1),
          () => 1
        );
        const urls = assetUrlsOf(data);
        const keys = new Set(urls.map(assetKey));
        downloadingKeys.add(keys);
        try {
          const kept = await keepAssets(urls).catch(() => ({ keys: [], bytes: 0, failed: keys.size }));
          await idb.setAssets(type, id, {
            done: true,
            failed: kept.failed + (await pages) + (await shell),
            keys: kept.keys,
            bytes: kept.bytes + sizeOf(data),
          });
        } finally {
          downloadingKeys.delete(keys);
        }
      }
      await release(formerKeys);
    } finally {
      downloading.value.delete(key);
    }
  }

  async function changed(change: Promise<unknown>) {
    await change;
    await refresh();
  }

  async function createFolder(name: string, section: SavedMode) {
    const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await changed(idb.saveFolder({ id, name, section }));
    return id;
  }

  // The pack of the day (CDC, lot 1): a route and its waypoints (hut, summit, access...) offline, in a new folder. A
  // waypoint already saved stays where it is; one that fails does not stop the others. How many waypoints were saved
  async function saveDayPack(route: { id: number; lang: string; title: string }, folderName: string) {
    const folderId = await createFolder(folderName, OFFLINE_MODE);
    await saveDocument({ type: 'route', ...route, folderId, mode: OFFLINE_MODE });
    const associations = find('route', route.id)?.data?.associations ?? {};
    const waypoints: { document_id?: number; locales?: { title?: string | null }[] }[] = [
      ...(associations.waypoints ?? []),
      ...(associations.waypoint_children ?? []),
    ];
    let saved = 0;
    for (const waypoint of waypoints) {
      if (!waypoint.document_id || find('waypoint', waypoint.document_id)) {
        continue;
      }
      await saveDocument({
        type: 'waypoint',
        id: waypoint.document_id,
        lang: route.lang,
        title: waypoint.locales?.[0]?.title ?? '',
        folderId,
        mode: OFFLINE_MODE,
      }).then(
        () => saved++,
        () => {}
      );
    }
    return saved;
  }

  return {
    online,
    savedDocs,
    folders,
    refresh,
    isSaved: (type: string, id: number) => !!find(type, id),
    isOfflineReady: (type: string, id: number) => find(type, id)?.mode === OFFLINE_MODE,
    isDownloading,
    find,
    saveDocument,
    // a saved document to the offline section, or its copy downloaded again
    downloadForOffline: (entry: SavedEntry) =>
      saveDocument({ ...entry, folderId: entry.mode === OFFLINE_MODE ? entry.folderId : null, mode: OFFLINE_MODE }),
    // both free the space of its files
    async makeOnline(type: string, id: number) {
      const keys = find(type, id)?.assets?.keys;
      await idb.makeOnline(type, id);
      await release(keys);
    },
    async removeDocument(type: string, id: number) {
      const keys = find(type, id)?.assets?.keys;
      await idb.deleteDocument(type, id);
      await release(keys);
    },
    moveToFolder: (type: string, id: number, folderId: string | null) => changed(idb.setFolder(type, id, folderId)),
    createFolder,
    saveDayPack,
    renameFolder: (folder: Folder, name: string) => changed(idb.saveFolder({ ...folder, name })),
    removeFolder: (id: string) => changed(idb.deleteFolder(id)),
    foldersOf: (section: SavedMode) => folders.value.filter((folder) => folder.section === section),
    // the documents of a section and its folders
    async purge(section: SavedMode) {
      const keys: string[] = [];
      for (const entry of savedDocs.value.filter((entry) => entry.mode === section)) {
        keys.push(...(entry.assets?.keys ?? []));
        await idb.deleteDocument(entry.type, entry.id);
      }
      for (const folder of folders.value.filter((folder) => folder.section === section)) {
        await idb.deleteFolder(folder.id);
      }
      await release(keys);
    },
  };
});
