// The favourites kept on this device, in IndexedDB, which the service worker reads too (it answers the API from it
// without a network, see service-worker.ts). Two modes:
//   - 'online': a favourite of a user logged out, a title and nothing else, read with a network. A logged in user has
//     their favourites on their account (src/stores/favourites.ts): theirs are sent there, then removed from here;
//   - 'offline': the cooked document, its images and the map tiles around it (in the caches of the service worker),
//     taken to the mountain. A favourite too, logged in or not.
// One copy per document, in the language it was saved in.
//
// A computer may be shared by several people (a family): each copy says who took it offline (owners), and a favourite
// of a user logged out belongs to nobody. A user logged in sees their copies only; logged out, all the copies show (a
// session may end in the mountains), with the favourites of nobody.
import { del, get, keys, set } from 'idb-keyval';

// the documents it keeps
export const SAVABLE_TYPES = ['route', 'waypoint', 'outing', 'article', 'book', 'xreport'];

export const ONLINE_MODE = 'online';
export const OFFLINE_MODE = 'offline';
export type SavedMode = typeof ONLINE_MODE | typeof OFFLINE_MODE;

export interface SavedEntry {
  type: string;
  id: number;
  // the language of the API (?cook=), as saved
  lang: string;
  // the cooked document, offline only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  title: string;
  folderId: string | null;
  mode: SavedMode;
  // the ids of the users who took this copy offline; nobody for a favourite of a user logged out. Absent from the
  // entries saved before, until they are migrated (src/stores/offline.ts)
  owners?: number[];
  // the users who chose to keep this favourite of nobody out of their account: it is not offered to them again
  declined?: number[];
  savedAt: number;
  // the last copy of the document received (offline only), what its age is counted from
  downloadedAt: number | null;
  // the images and tiles of an offline document: done when all were tried, failed is how many could not be downloaded
  assets?: {
    done: boolean;
    failed: number;
    // the files it uses in the cache of saved-assets.ts, and what the copy weighs with them (bytes). Absent from the
    // copies saved before, until they are migrated (src/stores/offline.ts)
    keys?: string[];
    bytes?: number;
    // how many of those files the cache no longer holds, at the last check: the browser may clear the data of the site
    // when the phone is short of space, or the user may clear it
    missing?: number;
    // the map layers downloaded, with their highest zoom (offline-assets.ts offlineTilesOf): the map offers them
    // without a network. OpenTopoMap only for the copies saved before
    layers?: Record<string, number>;
  };
}

export interface Folder {
  id: string;
  name: string;
  // the section it was created in, before favourites had one set of folders for both: no longer read
  section: SavedMode;
}

export const docKey = (type: string, id: number | string) => `doc:${type}/${id}`;
const folderKey = (id: string) => `folder:${id}`;
const isKeyOf = (prefix: string) => (key: IDBValidKey) => typeof key === 'string' && key.startsWith(prefix);

export const isOfflineEntry = (entry?: SavedEntry | null): entry is SavedEntry =>
  !!entry?.data && entry.mode === OFFLINE_MODE;

export function isDownloadComplete(entry: SavedEntry) {
  return !entry.assets || (entry.assets.done && entry.assets.failed === 0 && !entry.assets.missing);
}

async function update(key: string, change: (entry: SavedEntry) => Partial<SavedEntry>) {
  const entry = await get<SavedEntry>(key);
  if (entry) {
    await set(key, { ...entry, ...change(entry) });
  }
}

export async function saveDocument(
  entry: Pick<SavedEntry, 'type' | 'id' | 'lang' | 'data' | 'title' | 'folderId' | 'mode' | 'owners'>
) {
  const key = docKey(entry.type, entry.id);
  const previous = await get<SavedEntry>(key);
  const offline = entry.mode === OFFLINE_MODE;
  await set(key, {
    ...entry,
    data: offline ? entry.data : null,
    // the owners of the copy it replaces stay, unless given
    // a plain copy: IndexedDB cannot clone the reactive proxies
    owners: [...(entry.owners ?? previous?.owners ?? [])],
    declined: previous?.declined ?? [],
    savedAt: previous?.savedAt ?? Date.now(),
    downloadedAt: offline ? Date.now() : null,
  } satisfies SavedEntry);
}

// back to a favourite only: the content goes, the folder stays (one set of folders for both)
export const makeOnline = (type: string, id: number) =>
  update(docKey(type, id), () => ({
    mode: ONLINE_MODE,
    data: null,
    downloadedAt: null,
    assets: undefined,
  }));

export const setAssets = (type: string, id: number, assets: SavedEntry['assets']) =>
  update(docKey(type, id), () => ({ assets }));

export const setMissing = (type: string, id: number, missing: number) =>
  update(docKey(type, id), (entry) => (entry.assets ? { assets: { ...entry.assets, missing } } : {}));

export const setOwners = (type: string, id: number, owners: number[]) => update(docKey(type, id), () => ({ owners }));

export const setDeclined = (type: string, id: number, declined: number[]) =>
  update(docKey(type, id), () => ({ declined }));

export const setFolder = (type: string, id: number, folderId: string | null) =>
  update(docKey(type, id), () => ({ folderId }));

export const deleteDocument = (type: string, id: number) => del(docKey(type, id));

async function list<T>(prefix: string) {
  const values = await Promise.all((await keys()).filter(isKeyOf(prefix)).map((key) => get<T>(key)));
  return values.filter((value) => value !== undefined) as T[];
}

export const listDocuments = () => list<SavedEntry>('doc:');
export const listFolders = () => list<Folder>('folder:');

export const saveFolder = (folder: Folder) => set(folderKey(folder.id), folder);

// its documents stay, without a folder
export async function deleteFolder(id: string) {
  for (const entry of await listDocuments()) {
    if (entry.folderId === id) {
      await setFolder(entry.type, entry.id, null);
    }
  }
  await del(folderKey(id));
}

const DAY_MS = 24 * 3600 * 1000;

// how old the copy of an offline document is: conditions change, a copy of last month may say otherwise
export function freshnessOf(entry: SavedEntry, now = Date.now()) {
  if (!entry.downloadedAt) {
    return 'unknown';
  }
  const age = now - entry.downloadedAt;
  return age < 7 * DAY_MS ? 'fresh' : age < 30 * DAY_MS ? 'stale' : 'very-stale';
}

// What an offline copy needs, the most urgent first: files missing (it may not open fully without a network), then its
// age. Never blocking: an old topo is better than none in a hut. Null for a bookmark, a copy being downloaded, or a
// fresh complete one
export type Attention = 'incomplete' | 'expired' | 'update';

export function attentionOf(entry: SavedEntry, now = Date.now()): Attention | null {
  if (!isOfflineEntry(entry) || entry.assets?.done === false) {
    return null;
  }
  if (!isDownloadComplete(entry)) {
    return 'incomplete';
  }
  const freshness = freshnessOf(entry, now);
  return freshness === 'very-stale' ? 'expired' : freshness === 'stale' ? 'update' : null;
}
