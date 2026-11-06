// "My topos" (src/pwa/offline-store.ts) as the pages show them, the downloads for offline, and whether the network is
// there
import { defineStore } from 'pinia';
import { ref } from 'vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import config from '@/js/config';
import { imageUrlsOf, tileUrlsOf } from '@/pwa/offline-assets';
import * as idb from '@/pwa/offline-store';
import { OFFLINE_MODE, ONLINE_MODE, type Folder, type SavedEntry, type SavedMode } from '@/pwa/offline-store';

// what a phone downloads at once without waiting on each file in turn
const PARALLEL_REQUESTS = 6;

// downloads the urls (the service worker keeps them), PARALLEL_REQUESTS at a time; how many failed
async function download(urls: string[]) {
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < urls.length) {
      // with CORS, the service worker keeps 200 only (see service-worker.ts). From the network: the copy of the HTTP
      // cache of an image the page showed came without CORS headers, and would be refused
      const response = await fetch(urls[next++], { credentials: 'omit', cache: 'reload' }).catch(() => null);
      if (!response?.ok) {
        failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_REQUESTS, urls.length) }, worker));
  return failed;
}

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
  await Promise.all([import('@/components/map/OlMap.vue'), ...views.map((view) => view())]);
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
  // no IndexedDB (a private window of an old browser): no saved documents
  refresh().catch(() => {});

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
        const failed =
          (await download(imageUrlsOf(data))) + (await download(tileUrlsOf(data.geometry))) + (await pages);
        await idb.setAssets(type, id, { done: true, failed });
      }
      await refresh();
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
    makeOnline: (type: string, id: number) => changed(idb.makeOnline(type, id)),
    removeDocument: (type: string, id: number) => changed(idb.deleteDocument(type, id)),
    moveToFolder: (type: string, id: number, folderId: string | null) => changed(idb.setFolder(type, id, folderId)),
    createFolder,
    renameFolder: (folder: Folder, name: string) => changed(idb.saveFolder({ ...folder, name })),
    removeFolder: (id: string) => changed(idb.deleteFolder(id)),
    foldersOf: (section: SavedMode) => folders.value.filter((folder) => folder.section === section),
    // the documents of a section and its folders
    async purge(section: SavedMode) {
      for (const entry of savedDocs.value.filter((entry) => entry.mode === section)) {
        await idb.deleteDocument(entry.type, entry.id);
      }
      for (const folder of folders.value.filter((folder) => folder.section === section)) {
        await idb.deleteFolder(folder.id);
      }
      await refresh();
    },
  };
});
