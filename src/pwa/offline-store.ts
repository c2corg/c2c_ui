// "My topos": the documents saved on this device, in IndexedDB, which the service worker reads too (it answers the
// API from it without a network, see service-worker.ts). Two sections:
//   - 'online': a bookmark, a title and nothing else, read with a network;
//   - 'offline': the cooked document, its images and the map tiles around it (in the caches of the service worker),
//     taken to the mountain.
// One copy per document, in the language it was saved in.
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
  savedAt: number;
  // the last copy of the document received (offline only), what its age is counted from
  downloadedAt: number | null;
  // the images and tiles of an offline document: done when all were tried, failed is how many could not be downloaded
  assets?: { done: boolean; failed: number };
}

export interface Folder {
  id: string;
  name: string;
  // a folder belongs to one section
  section: SavedMode;
}

export const docKey = (type: string, id: number | string) => `doc:${type}/${id}`;
const folderKey = (id: string) => `folder:${id}`;
const isKeyOf = (prefix: string) => (key: IDBValidKey) => typeof key === 'string' && key.startsWith(prefix);

export const isOfflineEntry = (entry?: SavedEntry | null): entry is SavedEntry =>
  !!entry?.data && entry.mode === OFFLINE_MODE;

export function isDownloadComplete(entry: SavedEntry) {
  return !entry.assets || (entry.assets.done && entry.assets.failed === 0);
}

async function update(key: string, change: (entry: SavedEntry) => Partial<SavedEntry>) {
  const entry = await get<SavedEntry>(key);
  if (entry) {
    await set(key, { ...entry, ...change(entry) });
  }
}

export async function saveDocument(
  entry: Pick<SavedEntry, 'type' | 'id' | 'lang' | 'data' | 'title' | 'folderId' | 'mode'>
) {
  const key = docKey(entry.type, entry.id);
  const previous = await get<SavedEntry>(key);
  const offline = entry.mode === OFFLINE_MODE;
  await set(key, {
    ...entry,
    data: offline ? entry.data : null,
    savedAt: previous?.savedAt ?? Date.now(),
    downloadedAt: offline ? Date.now() : null,
  } satisfies SavedEntry);
}

// back to a bookmark: the content goes, and the folder (folders are per section)
export const makeOnline = (type: string, id: number) =>
  update(docKey(type, id), () => ({
    mode: ONLINE_MODE,
    data: null,
    downloadedAt: null,
    assets: undefined,
    folderId: null,
  }));

export const setAssets = (type: string, id: number, assets: SavedEntry['assets']) =>
  update(docKey(type, id), () => ({ assets }));

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
