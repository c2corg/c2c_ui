// The rows of the Favourites page: a favourite, and its offline copy on this device if any
import { attentionOf, isDownloadComplete, isOfflineEntry, type SavedEntry } from '@/pwa/offline-store';
import type { Favourite, FavouriteFolder } from '@/stores/favourites';

export interface FavouriteRow {
  favourite: Favourite;
  entry: SavedEntry | null;
}

export type CopyState = 'fresh' | 'old' | 'incomplete';

// the state of an offline copy, as the colour of its badge and tags: colour for old and incomplete only
export function copyStateOf(entry: SavedEntry | null): CopyState | null {
  if (!isOfflineEntry(entry)) {
    return null;
  }
  // a download stopped halfway (the tab closed) counts as incomplete, but not one in progress (see the caller)
  if (entry.assets?.done === false || !isDownloadComplete(entry)) {
    return 'incomplete';
  }
  return attentionOf(entry) ? 'old' : 'fresh';
}

export const rowsOf = (favourites: Favourite[], find: (type: string, id: number) => SavedEntry | undefined) =>
  favourites.map((favourite): FavouriteRow => {
    const entry = find(favourite.type, favourite.id);
    return { favourite, entry: isOfflineEntry(entry) ? entry : null };
  });

// the folders, then what is in none (last); empty folders only when asked (the All filter: a new folder shows)
export function groupsOf(rows: FavouriteRow[], folders: FavouriteFolder[], withEmpty: boolean) {
  const groups: { folder: FavouriteFolder | null; rows: FavouriteRow[] }[] = folders
    .map((folder) => ({ folder, rows: rows.filter((row) => row.favourite.folderId === folder.id) }))
    .filter((group) => withEmpty || group.rows.length);
  const unfiled = rows.filter((row) => !folders.some((folder) => folder.id === row.favourite.folderId));
  if (unfiled.length) {
    groups.push({ folder: null, rows: unfiled });
  }
  return groups;
}

// in MB, a decimal under 10
export const formatSize = (bytes: number, lang?: string | null) =>
  new Intl.NumberFormat(lang ?? undefined, {
    style: 'unit',
    unit: 'megabyte',
    maximumFractionDigits: bytes < 1e7 ? 1 : 0,
  }).format(Math.max(bytes, 1e5) / 1e6);
