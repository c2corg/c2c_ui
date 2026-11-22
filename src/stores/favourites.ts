// The favourites of the user, in their folders: on their account when logged in (the API, /favourites), on this device
// when logged out (src/pwa/offline-store.ts, the 'online' entries and the local folders).
//
// Offline copies stay in the offline store (src/stores/offline.ts), on the device, logged in or not. An offline copy is
// always a favourite: downloading one adds the favourite, removing the favourite removes the copy, removing the copy
// keeps the favourite.
//
// Logged in:
//   - the list the API last gave is kept in IndexedDB (src/pwa/favourites-cache.ts): the page opens without a network;
//   - add, remove and move change the list at once, and are sent to the API; without a network they wait in a queue,
//     sent in order when the network is back (the API makes them idempotent). The folders (create, rename, delete)
//     need a network: they fail otherwise;
//   - their offline copies are their favourite: ensured on the account at each start with a network;
//   - the favourites of the device (saved logged out, nobody's) are offered once the account is read: added, those
//     without a copy leave the device and the copies become the user's (their folders go by name); kept on the device,
//     they are not offered to that user again.
//
// A computer may be shared (src/pwa/offline-store.ts): the copies of the other users stay on the device, out of the
// favourites of the user logged in. Signing out forgets the list of the account on the device, after sending the
// changes still waiting.
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import c2c from '@/js/apis/c2c';
import type { ApiFavourite, ApiFavouriteFolder } from '@/js/apis/c2c/FavouritesService';
import constants from '@/js/constants';
import {
  forgetUser,
  readList,
  readPending,
  writeList,
  writePending,
  type Favourite,
  type FavouriteFolder,
  type FavouritesList,
  type PendingChange,
} from '@/pwa/favourites-cache';
import { isOfflineEntry, OFFLINE_MODE, type SavedEntry } from '@/pwa/offline-store';
import { useLanguageStore } from '@/stores/language';
import { useOfflineStore } from '@/stores/offline';
import { useUserStore } from '@/stores/user';

export type { Favourite, FavouriteFolder } from '@/pwa/favourites-cache';

// a document of a page, as it is added
export interface FavouriteDocument {
  type: string;
  id: number;
  title: string;
  lang: string;
}

const typeOf = (letter: string) => constants.letterToDocumentType[letter] ?? letter;

const fromApi = (favourite: ApiFavourite): Favourite => ({
  type: typeOf(favourite.type),
  id: favourite.document_id,
  title: [favourite.title_prefix, favourite.title].filter(Boolean).join(' : ') || `#${favourite.document_id}`,
  lang: favourite.lang,
  folderId: favourite.folder_id === null ? null : String(favourite.folder_id),
  createdAt: Date.parse(favourite.created_at) || 0,
});

const folderFromApi = (folder: ApiFavouriteFolder): FavouriteFolder => ({ id: String(folder.id), name: folder.name });

const fromEntry = (entry: SavedEntry): Favourite => ({
  type: entry.type,
  id: entry.id,
  title: entry.title,
  lang: entry.lang,
  folderId: entry.folderId,
  createdAt: entry.savedAt,
});

const apiFolderId = (folderId: string | null) => (folderId === null ? null : Number(folderId));

// no answer from the API: the change waits for the network
const isNetworkError = (error: unknown) => !(error as { response?: unknown } | null)?.response;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// a change on a list, as the API will do it
function applyTo(list: FavouritesList, change: PendingChange, doc?: FavouriteDocument): FavouritesList {
  const others = list.favourites.filter((item) => !(item.type === change.type && item.id === change.id));
  const current = list.favourites.find((item) => item.type === change.type && item.id === change.id);
  switch (change.op) {
    case 'add':
      return {
        ...list,
        favourites: [
          current
            ? { ...current, folderId: change.folderId ?? current.folderId }
            : {
                type: change.type,
                id: change.id,
                title: doc?.title ?? `#${change.id}`,
                lang: doc?.lang ?? null,
                folderId: change.folderId,
                createdAt: Date.now(),
              },
          ...others,
        ],
      };
    case 'remove':
      return { ...list, favourites: others };
    case 'move':
      return {
        ...list,
        favourites: list.favourites.map((item) => (item === current ? { ...item, folderId: change.folderId } : item)),
      };
  }
}

export const useFavouritesStore = defineStore('favourites', () => {
  const user = useUserStore();
  const offline = useOfflineStore();
  const language = useLanguageStore();
  // named $gettext: the extraction of the messages to translate (tools/extract-messages.ts) looks for it
  const $gettext = (msgid: string) => language.gettext(msgid);

  // the list of the account (logged in only): from the cache, then from the API
  const account = ref<FavouritesList | null>(null);
  // the changes waiting for the network
  const pending = ref<PendingChange[]>([]);
  const syncing = ref(false);

  const isLogged = computed(() => user.isLogged && user.id !== null);
  const userId = () => user.id as number;

  const findEntry = (type: string, id: number) => offline.find(type, id);
  const isOnAccount = (type: string, id: number) =>
    !!account.value?.favourites.some((item) => item.type === type && item.id === id);

  const isNobodys = (entry: SavedEntry) => !entry.owners?.length;
  const isOwnedBy = (entry: SavedEntry, id: number) => !!entry.owners?.includes(id);
  // logged out: all the copies, and the favourites of nobody; logged in: the copies of the user
  const isShown = (entry: SavedEntry) =>
    isLogged.value ? isOfflineEntry(entry) && isOwnedBy(entry, userId()) : isOfflineEntry(entry) || isNobodys(entry);
  const shownEntries = computed(() => offline.savedDocs.filter(isShown));
  // the offline copy of a document, if the user sees it
  const copyOf = (type: string, id: number) => {
    const entry = findEntry(type, id);
    return entry && isOfflineEntry(entry) && isShown(entry) ? entry : undefined;
  };

  // what the pages show
  const favourites = computed<Favourite[]>(() => {
    if (!isLogged.value) {
      return shownEntries.value.map(fromEntry).sort((a, b) => b.createdAt - a.createdAt);
    }
    const list = account.value?.favourites ?? [];
    // the copies of the user not on the account yet (sent at the next start with a network): their folders are not the
    // ones of the account
    const local = shownEntries.value
      .filter((entry) => !list.some((item) => item.type === entry.type && item.id === entry.id))
      .map((entry) => ({ ...fromEntry(entry), folderId: null }));
    return [...list, ...local].sort((a, b) => b.createdAt - a.createdAt);
  });

  // logged in, the account read with a network: the favourites of nobody that the user did not keep out yet
  const deviceOffer = computed(() => {
    if (!isLogged.value || !account.value || syncing.value || !offline.online) {
      return [];
    }
    const id = userId();
    return offline.savedDocs.filter(
      (entry) => isNobodys(entry) && !entry.declined?.includes(id) && !isOnAccount(entry.type, entry.id)
    );
  });

  // logged in: the copies of the other users of the device (and those of nobody), which only take space here
  const othersCopies = computed(() =>
    isLogged.value ? offline.savedDocs.filter((entry) => isOfflineEntry(entry) && !isOwnedBy(entry, userId())) : []
  );

  // the user no longer has this copy: it goes when nobody else has it
  async function disown(entry: SavedEntry) {
    const owners = (entry.owners ?? []).filter((owner) => owner !== userId());
    await (owners.length
      ? offline.setOwners(entry.type, entry.id, owners)
      : offline.removeDocument(entry.type, entry.id));
  }

  const folders = computed<FavouriteFolder[]>(() =>
    isLogged.value
      ? (account.value?.folders ?? [])
      : offline.folders.map((folder) => ({ id: folder.id, name: folder.name }))
  );

  const find = (type: string, id: number) => favourites.value.find((item) => item.type === type && item.id === id);
  const isFavourite = (type: string, id: number) => !!find(type, id);

  async function persist() {
    if (isLogged.value && account.value) {
      // plain copies: IndexedDB cannot clone the reactive proxies
      await writeList(userId(), JSON.parse(JSON.stringify(account.value)));
      await writePending(userId(), JSON.parse(JSON.stringify(pending.value)));
    }
  }

  // the list of the account, from the API; the changes still waiting are applied on it
  async function load() {
    const id = userId();
    const { data } = await c2c.favourites.list(c2c.getApiLang(language.current ?? undefined));
    if (user.id !== id) {
      return;
    }
    let list: FavouritesList = { favourites: data.favourites.map(fromApi), folders: data.folders.map(folderFromApi) };
    for (const change of pending.value) {
      list = applyTo(list, change, account.value ? findIn(account.value, change) : undefined);
    }
    account.value = list;
    await persist();
  }

  const findIn = (list: FavouritesList, change: PendingChange): FavouriteDocument | undefined => {
    const item = list.favourites.find((favourite) => favourite.type === change.type && favourite.id === change.id);
    return item ? { type: item.type, id: item.id, title: item.title, lang: item.lang ?? '' } : undefined;
  };

  function send(change: PendingChange) {
    switch (change.op) {
      case 'add':
        return c2c.favourites.add(change.id, apiFolderId(change.folderId));
      case 'remove':
        return c2c.favourites.remove(change.id);
      case 'move':
        return c2c.favourites.move(change.id, apiFolderId(change.folderId));
    }
  }

  // the changes made without a network, in order. One the API refuses is dropped (the list is loaded again after)
  async function flush() {
    while (pending.value.length) {
      try {
        await send(pending.value[0]);
      } catch (error) {
        if (isNetworkError(error)) {
          return false;
        }
      }
      pending.value = pending.value.slice(1);
      await persist();
    }
    return true;
  }

  // a change of the account: at once on the list, then to the API, or queued without a network
  async function change(change: PendingChange, doc?: FavouriteDocument) {
    account.value = applyTo(account.value ?? { favourites: [], folders: [] }, change, doc);
    if (pending.value.length || !offline.online) {
      pending.value = [...pending.value, change];
      await persist();
      return;
    }
    await persist();
    try {
      await send(change);
    } catch (error) {
      if (!isNetworkError(error)) {
        await load().catch(() => {});
        throw error;
      }
      pending.value = [...pending.value, change];
      await persist();
    }
  }

  // the copies of the user are their favourites (see the top)
  async function pushOwnCopies() {
    for (const entry of shownEntries.value.filter((item) => !isOnAccount(item.type, item.id))) {
      await change(
        { op: 'add', type: entry.type, id: entry.id, folderId: null },
        { type: entry.type, id: entry.id, title: entry.title, lang: entry.lang }
      );
    }
  }

  // The favourites of the device offered, to the account. The folders by name: one of the account, or a new one
  async function acceptDeviceFavourites() {
    const entries = deviceOffer.value;
    const id = userId();
    const folderIds = new Map<string, string>();
    for (const folder of offline.folders.filter((item) => entries.some((entry) => entry.folderId === item.id))) {
      folderIds.set(folder.id, await folderNamed(folder.name));
    }
    for (const entry of entries) {
      const folderId = entry.folderId ? (folderIds.get(entry.folderId) ?? null) : null;
      await change(
        { op: 'add', type: entry.type, id: entry.id, folderId },
        { type: entry.type, id: entry.id, title: entry.title, lang: entry.lang }
      );
      // a favourite without a copy: on the account only now
      const { type, id: documentId } = entry;
      await (isOfflineEntry(entry)
        ? offline.setOwners(type, documentId, [id])
        : offline.removeDocument(type, documentId));
    }
  }

  // they stay on the device, not offered to this user again
  async function declineDeviceFavourites() {
    const id = userId();
    for (const entry of deviceOffer.value) {
      await offline.setDeclined(entry.type, entry.id, [...(entry.declined ?? []), id]);
    }
  }

  // the folder of the account of that name, created if needed: its id
  async function folderNamed(name: string) {
    const existing = account.value?.folders.find((folder) => sameName(folder.name, name));
    if (existing) {
      return existing.id;
    }
    return createFolder(name);
  }

  // with the network: the changes made without it, the list of the account, the favourites of the device
  let syncRun: Promise<void> | null = null;
  function sync() {
    syncRun ??= (async () => {
      syncing.value = true;
      try {
        if (await flush()) {
          await load();
          await pushOwnCopies();
        }
      } finally {
        syncing.value = false;
        syncRun = null;
      }
    })();
    return syncRun;
  }

  // at the start, and at each sign in or out
  async function start() {
    account.value = null;
    pending.value = [];
    await offline.ready;
    if (!isLogged.value) {
      await offline.mergeFoldersByName().catch(() => {});
      return;
    }
    const id = userId();
    const [cached, waiting] = await Promise.all([readList(id).catch(() => undefined), readPending(id).catch(() => [])]);
    if (user.id !== id) {
      return;
    }
    account.value = cached ?? null;
    pending.value = waiting;
    if (offline.online) {
      await sync().catch(() => {});
    }
  }

  // not in a ref: a reactive proxy of a promise cannot be awaited
  let started: Promise<void> = Promise.resolve();
  watch(
    () => user.id,
    () => {
      started = start();
    },
    { immediate: true }
  );
  // Before signing out: the changes still waiting are sent, then the list of the account leaves the device (another
  // person may use it). Without a network they would be lost: the user decides. A session that ended keeps all
  user.beforeSignOut(async () => {
    if (!isLogged.value) {
      return true;
    }
    const id = userId();
    await started;
    if (pending.value.length && offline.online) {
      await flush().catch(() => false);
    }
    if (
      pending.value.length &&
      !window.confirm(
        $gettext(
          'Some changes to your favourites are not sent yet: without a network they will be lost. Sign out anyway?'
        )
      )
    ) {
      return false;
    }
    await forgetUser(id).catch(() => {});
    return true;
  });

  // the network is back: what waited is sent
  watch(
    () => offline.online,
    (online) => {
      if (online && isLogged.value) {
        void sync().catch(() => {});
      }
    }
  );

  async function add(doc: FavouriteDocument, folderId: string | null = null) {
    if (!isLogged.value) {
      if (findEntry(doc.type, doc.id)) {
        await offline.moveToFolder(doc.type, doc.id, folderId);
      } else {
        await offline.bookmark({ ...doc, folderId });
      }
      return;
    }
    await change({ op: 'add', type: doc.type, id: doc.id, folderId }, doc);
  }

  // the offline copy too: logged in, the copy of the user only (the others keep theirs)
  async function remove(type: string, id: number) {
    const entry = findEntry(type, id);
    if (!isLogged.value) {
      if (entry) {
        await offline.removeDocument(type, id);
      }
      return;
    }
    await change({ op: 'remove', type, id });
    if (entry && isOwnedBy(entry, userId())) {
      await disown(entry);
    }
  }

  async function move(type: string, id: number, folderId: string | null) {
    if (!isLogged.value) {
      await offline.moveToFolder(type, id, folderId);
      return;
    }
    const item = find(type, id);
    await (isOnAccount(type, id)
      ? change({ op: 'move', type, id, folderId })
      : change(
          { op: 'add', type, id, folderId },
          item && { type, id, title: item.title, lang: item.lang ?? language.current ?? 'fr' }
        ));
  }

  // downloaded on the device, and a favourite (in that folder if given)
  async function saveOffline(doc: FavouriteDocument, folderId?: string | null) {
    const entry = findEntry(doc.type, doc.id);
    const favourite = find(doc.type, doc.id);
    await offline.saveDocument({
      ...doc,
      // logged in, the folders are the ones of the account: the copy keeps the folder of the device
      folderId: isLogged.value ? (entry?.folderId ?? null) : (folderId ?? entry?.folderId ?? null),
      mode: OFFLINE_MODE,
      // one copy per document: the user is one more owner of it (logged out, the owners stay)
      owners: isLogged.value ? [...new Set([...(entry?.owners ?? []), userId()])] : undefined,
    });
    // a favourite of the device not sent yet counts as missing: sent now
    if (
      isLogged.value &&
      (!isOnAccount(doc.type, doc.id) || (folderId !== undefined && favourite?.folderId !== folderId))
    ) {
      await change({ op: 'add', type: doc.type, id: doc.id, folderId: folderId ?? favourite?.folderId ?? null }, doc);
    }
  }

  // the favourite stays
  async function removeOfflineCopy(type: string, id: number) {
    const entry = copyOf(type, id);
    if (!entry) {
      return;
    }
    if (isLogged.value) {
      // the favourite is on the account
      if (!isOnAccount(type, id)) {
        await change({ op: 'add', type, id, folderId: null }, { type, id, title: entry.title, lang: entry.lang });
      }
      await disown(entry);
    } else if (isNobodys(entry)) {
      await offline.makeOnline(type, id);
    } else {
      // the favourite of its owners is on their account
      await offline.removeDocument(type, id);
    }
  }

  async function removeAllOfflineCopies() {
    for (const entry of shownEntries.value.filter(isOfflineEntry)) {
      await removeOfflineCopy(entry.type, entry.id);
    }
  }

  // the space they take, freed: their owners will download them again
  async function removeOthersCopies() {
    for (const entry of othersCopies.value) {
      await offline.removeDocument(entry.type, entry.id);
    }
  }

  // its id; with a network only when logged in
  async function createFolder(name: string): Promise<string> {
    if (!isLogged.value) {
      return offline.createFolder(name);
    }
    const { data } = await c2c.favourites.createFolder(name);
    const folder = folderFromApi(data);
    account.value = { ...(account.value ?? { favourites: [] }), folders: [...(account.value?.folders ?? []), folder] };
    await persist();
    return folder.id;
  }

  async function renameFolder(folderId: string, name: string) {
    if (!isLogged.value) {
      const folder = offline.folders.find((item) => item.id === folderId);
      if (folder) {
        await offline.renameFolder(folder, name);
      }
      return;
    }
    const { data } = await c2c.favourites.renameFolder(Number(folderId), name);
    const renamed = folderFromApi(data);
    account.value = {
      ...account.value!,
      folders: account.value!.folders.map((folder) => (folder.id === folderId ? renamed : folder)),
    };
    await persist();
  }

  // its favourites stay, without a folder
  async function removeFolder(folderId: string) {
    if (!isLogged.value) {
      await offline.removeFolder(folderId);
      return;
    }
    await c2c.favourites.deleteFolder(Number(folderId));
    account.value = {
      folders: account.value!.folders.filter((folder) => folder.id !== folderId),
      favourites: account.value!.favourites.map((item) =>
        item.folderId === folderId ? { ...item, folderId: null } : item
      ),
    };
    await persist();
  }

  // The pack of the day: a route and its waypoints (hut, summit, access...) offline, in a new folder. A waypoint
  // already offline stays where it is; one that fails does not stop the others. How many waypoints were saved
  async function saveDayPack(route: { id: number; lang: string; title: string }, folderName: string) {
    const folderId = await createFolder(folderName);
    await saveOffline({ type: 'route', ...route }, folderId);
    const associations = findEntry('route', route.id)?.data?.associations ?? {};
    const waypoints: { document_id?: number; locales?: { title?: string | null }[] }[] = [
      ...(associations.waypoints ?? []),
      ...(associations.waypoint_children ?? []),
    ];
    let saved = 0;
    for (const waypoint of waypoints) {
      if (!waypoint.document_id || copyOf('waypoint', waypoint.document_id)) {
        continue;
      }
      await saveOffline(
        { type: 'waypoint', id: waypoint.document_id, lang: route.lang, title: waypoint.locales?.[0]?.title ?? '' },
        folderId
      ).then(
        () => saved++,
        () => {}
      );
    }
    return saved;
  }

  return {
    isLogged,
    favourites,
    folders,
    // the list of the account was read (from the cache or the API); always true logged out
    loaded: computed(() => !isLogged.value || account.value !== null),
    pendingCount: computed(() => pending.value.length),
    syncing,
    // the start is done, for the current user
    whenReady: () => started,
    find,
    isFavourite,
    copyOf,
    deviceOffer,
    acceptDeviceFavourites,
    declineDeviceFavourites,
    othersCopies,
    removeOthersCopies,
    add,
    remove,
    move,
    saveOffline,
    removeOfflineCopy,
    removeAllOfflineCopies,
    createFolder,
    renameFolder,
    removeFolder,
    saveDayPack,
    // what another device or tab changed
    async refresh() {
      await offline.refresh();
      if (isLogged.value && offline.online) {
        await sync();
      }
    },
  };
});
