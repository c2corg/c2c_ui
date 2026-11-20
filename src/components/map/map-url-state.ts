// The settings of a document map (layers, overlays, protection areas) are kept on this device, in the local storage, with
// short stable ids rather than the titles of the layers (which are translated keys and may change with the map engine):
// they follow the user from a document to the next one, and survive a reload and a new tab, without changing the URL.
// The links shared while they were written in the URL of the page (?layer=ign&slopes=ign,swiss&overlays=outing,route&pin=top)
// are still read: their settings are shown on that page. Only the maps of the lists of documents (/outings, /routes...)
// still write them in the URL, to share a list with its map: they have no other storage.

import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import { DENSITY_TYPES, type DensityType } from './density-overlays';
import { baseLayers, slopeLayers } from './map-layers';
import { MAP_URL_KEYS } from './map-url-keys';

import { getPreferences } from '@/js/vue-plugins/local-storage';

export type MapUrlState = {
  base: string;
  slopes: string[];
  overlays: DensityType[];
  // false when the protection areas are hidden (they are shown by default where offered)
  protection: boolean;
  // '' when the map is not pinned, 'window' when it fills the window
  pin: string;
};

export const PIN_SIDES = ['top', 'right', 'window'];

// the ids are stored on devices and part of the URLs people shared: never change one
const BASE_IDS: Record<string, string> = {
  OpenTopoMap: 'otm',
  'ESRI World Imagery': 'esri',
  'Public transport': 'transport',
  'IGN maps': 'ign',
  'IGN ortho': 'ign-ortho',
  SwissTopo: 'swiss',
  'SwissTopo ortho': 'swiss-ortho',
  'IGN raster (es)': 'es',
  'IGN ortho (es)': 'es-ortho',
  'ICGC raster (ca)': 'ca',
  'ICGC ortho (ca)': 'ca-ortho',
  'Basemap (at)': 'at',
  'Basemap ortho (at)': 'at-ortho',
  'Ordnance Survey (uk)': 'uk',
};
const SLOPE_IDS: Record<string, string> = {
  'IGN Slopes': 'ign',
  'SwissTopo Slopes': 'swiss',
};

const invert = (ids: Record<string, string>) => Object.fromEntries(Object.entries(ids).map(([k, v]) => [v, k]));
const baseTitles = invert(BASE_IDS);
const slopeTitles = invert(SLOPE_IDS);

// anything but a string (a value of the local storage written by something else) is no value
const first = (value: unknown): string => {
  const item = Array.isArray(value) ? value[0] : value;
  return typeof item === 'string' ? item : '';
};
const list = (value: unknown) =>
  first(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// what the URL asks for; an unknown id, or one that is not offered, is ignored
export function parseMapUrl(query: LocationQuery): Partial<MapUrlState> {
  const state: Partial<MapUrlState> = {};

  const base = baseTitles[first(query.layer)];
  if (base && baseLayers.some((layer) => layer.title === base)) state.base = base;

  if (query.slopes !== undefined) {
    const known = new Set(slopeLayers.map((layer) => layer.title));
    state.slopes = list(query.slopes)
      .map((id) => slopeTitles[id])
      .filter((title) => title && known.has(title));
  }

  if (query.overlays !== undefined) {
    state.overlays = DENSITY_TYPES.filter((type) => list(query.overlays).includes(type));
  }

  if (first(query.protection) === '0') state.protection = false;

  const pin = first(query.pin);
  if (PIN_SIDES.includes(pin)) state.pin = pin;

  return state;
}

// the query with the map settings replaced by the current ones, and the other parameters untouched
export function withMapUrl(query: LocationQuery, state: MapUrlState, defaultBase: string): LocationQueryRaw {
  const result: LocationQueryRaw = { ...query };
  for (const key of MAP_URL_KEYS) delete result[key];

  if (state.base !== defaultBase && BASE_IDS[state.base]) result.layer = BASE_IDS[state.base];
  const slopes = state.slopes.map((title) => SLOPE_IDS[title]).filter(Boolean);
  if (slopes.length) result.slopes = slopes.join(',');
  if (state.overlays.length) result.overlays = state.overlays.join(',');
  if (!state.protection) result.protection = '0';
  if (state.pin) result.pin = state.pin;

  return result;
}

// the settings stored on this device are written as a query would be: the same ids, the same reading
const preferences = () => getPreferences('DocumentMap');

export function storedMapSettings(): Partial<MapUrlState> {
  const stored = preferences();
  // what another tab stored since this one read it
  stored.reload();
  const settings = parseMapUrl((stored.get('settings') ?? {}) as LocationQuery);
  delete settings.pin;
  return settings;
}

// a setting the user changed, kept with the stored ones: the others shown by the page (from an old shared link) are not
// stored. Only what differs from the default is written; the pinned side is not a setting kept from a page to the next
export function storeMapSettings(change: Partial<Omit<MapUrlState, 'pin'>>, defaultBase: string) {
  const state = { base: defaultBase, slopes: [], overlays: [], protection: true, ...storedMapSettings(), ...change };
  try {
    preferences().set('settings', withMapUrl({}, { ...state, pin: '' }, defaultBase));
  } catch {
    // no storage (private window, full or blocked): the settings last as long as the page
  }
}
