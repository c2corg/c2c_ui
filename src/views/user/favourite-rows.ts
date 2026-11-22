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

// what the page shows: a text in the title, and the chosen document types (all when none is chosen)
export function filterRows(rows: FavouriteRow[], search: string, types: string[]) {
  const words = normalize(search).split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    const title = normalize(row.favourite.title);
    return words.every((word) => title.includes(word)) && (!types.length || types.includes(row.favourite.type));
  });
}

// lower case, without accents: "ecrins" finds "Écrins"
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export type FavouriteOrder = 'alphabetical' | 'recent';

// alphabetical on the title as shown, the summit of a route first ("Summit : route"): the routes of a summit together
export function sortRows(rows: FavouriteRow[], order: FavouriteOrder, lang?: string | null) {
  if (order === 'recent') {
    return [...rows].sort((a, b) => b.favourite.createdAt - a.favourite.createdAt);
  }
  const collator = new Intl.Collator(lang ?? undefined, { sensitivity: 'base', numeric: true });
  return [...rows].sort((a, b) => collator.compare(a.favourite.title, b.favourite.title));
}

// the document types of the favourites, in the order of the site, with their count
export const typesOf = (rows: FavouriteRow[], order: readonly string[]) =>
  order
    .map((type) => ({ type, count: rows.filter((row) => row.favourite.type === type).length }))
    .filter((item) => item.count);

// in MB, a decimal under 10
export const formatSize = (bytes: number, lang?: string | null) =>
  new Intl.NumberFormat(lang ?? undefined, {
    style: 'unit',
    unit: 'megabyte',
    maximumFractionDigits: bytes < 1e7 ? 1 : 0,
  }).format(Math.max(bytes, 1e5) / 1e6);
