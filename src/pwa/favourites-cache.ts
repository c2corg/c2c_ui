// The favourites of a logged in user as the API last listed them, and the changes made since without a network, kept
// in IndexedDB: the Favourites page opens without a network, and the changes are sent once it is back
// (src/stores/favourites.ts). One copy per user of the device.
import { del, get, keys, set } from 'idb-keyval';

export interface Favourite {
  // the document type of the UI: route, waypoint...
  type: string;
  id: number;
  title: string;
  // the language of the title, the one of the link
  lang: string | null;
  // the id of its folder: the one of the API as a string, or the one of a local folder (src/pwa/offline-store.ts)
  folderId: string | null;
  createdAt: number;
}

export interface FavouriteFolder {
  id: string;
  name: string;
}

export interface FavouritesList {
  favourites: Favourite[];
  folders: FavouriteFolder[];
}

// what is sent to the API once the network is back: add, remove and move are idempotent, sent in order
export type PendingChange =
  | { op: 'add'; type: string; id: number; folderId: string | null }
  | { op: 'remove'; type: string; id: number }
  | { op: 'move'; type: string; id: number; folderId: string | null };

const listKey = (userId: number) => `favourites:${userId}`;
const pendingKey = (userId: number) => `favourites-pending:${userId}`;
// written before the offline copies had owners: the favourites of the device were sent to that account
const SYNCED_PREFIX = 'favourites-synced:';

export const readList = (userId: number) => get<FavouritesList>(listKey(userId));
export const writeList = (userId: number, list: FavouritesList) => set(listKey(userId), list);

export const readPending = async (userId: number) => (await get<PendingChange[]>(pendingKey(userId))) ?? [];
export const writePending = (userId: number, changes: PendingChange[]) =>
  changes.length ? set(pendingKey(userId), changes) : del(pendingKey(userId));

const syncedKeys = async () =>
  (await keys()).filter((key): key is string => typeof key === 'string' && key.startsWith(SYNCED_PREFIX));

// the users whose favourites of the device were sent to their account, before the copies had owners; then forgotten
export const syncedUsers = async () => (await syncedKeys()).map((key) => Number(key.slice(SYNCED_PREFIX.length)));
export const forgetSyncedUsers = async () => Promise.all((await syncedKeys()).map((key) => del(key)));

// what a user signing out leaves of their account on the device: nothing
export const forgetUser = (userId: number) => Promise.all([del(listKey(userId)), del(pendingKey(userId))]);
