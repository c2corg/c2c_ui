// The settings of a document map (layers, protection areas, pinned side) are kept on this device, in the local storage,
// with short stable ids rather than the titles of the layers (which are translated keys and may change with the map
// engine): they follow the user from a document to the next one, and survive a reload and a new tab.
// Of the base layer, only its category is kept (map-layers.ts): each document shows the layer of that category in its
// country, an IGN map in France and a swisstopo one in Switzerland. The "Tracks" and "Routes" overlays are not kept: they
// are turned on to explore an area, and each one fetches data as the map moves.
// What a map shows is also written in the URL of its page, with the same ids
// (?layer=ign&slopes=ign,swiss&overlays=outing,route&pin=top), to share it or bookmark it: a link with them shows them on
// its page, without changing what the device keeps. On the lists of documents (/outings, /routes...), the URL is the only
// place of the settings: they are not stored.

import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import { DENSITY_TYPES, type DensityType } from './density-overlays';
import { baseLayers, categoryOf, LAYER_CATEGORIES, slopeLayers, type LayerCategory } from './map-layers';
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

function storedQuery(): LocationQuery {
  const stored = preferences();
  // what another tab stored since this one read it
  stored.reload();
  return (stored.get('settings') ?? {}) as LocationQuery;
}

// the pinned side kept on this device: 'top' or 'right' ('' when not pinned). The whole window is not kept: it hides the
// page
export function storedPin(): string {
  const pin = first(storedQuery().pin);
  return pin === 'top' || pin === 'right' ? pin : '';
}

// the side the user pinned the map on, or unpinned it (''); the whole window leaves the stored side as it was
export function storePin(side: string) {
  if (side === 'window') return;
  try {
    const query: LocationQueryRaw = { ...storedQuery() };
    if (side) query.pin = side;
    else delete query.pin;
    preferences().set('settings', query);
  } catch {
    // no storage: the side lasts as long as the page
  }
}

// the stored settings but the base layer: its category is stored instead (storedLayerCategory). The overlays some devices
// stored before they were no longer kept are ignored
export function storedMapSettings(): Partial<Omit<MapUrlState, 'base' | 'overlays' | 'pin'>> {
  const { slopes, protection } = parseMapUrl(storedQuery());
  return { ...(slopes && { slopes }), ...(protection !== undefined && { protection }) };
}

// the category of base layer chosen on this device; the devices that stored a layer (before the categories) keep its one
export function storedLayerCategory(): LayerCategory | undefined {
  const query = storedQuery();
  const category = first(query.category) as LayerCategory;
  if (LAYER_CATEGORIES.includes(category)) return category;
  const base = parseMapUrl(query).base;
  return base ? categoryOf(base) : undefined;
}

// a setting the user changed, kept with the stored ones: the others shown by the page (from its link) are not stored. Only
// what differs from the default is written; the overlays are not kept from a page to the next, the pinned side is kept
// apart (storePin)
export function storeMapSettings(
  change: Partial<Omit<MapUrlState, 'base' | 'overlays' | 'pin'>> & { category?: LayerCategory },
  defaultBase: string
) {
  const { category = storedLayerCategory(), ...settings } = change;
  const state = { slopes: [], overlays: [], protection: true, ...storedMapSettings(), ...settings };
  try {
    const query: LocationQueryRaw = withMapUrl({}, { ...state, base: defaultBase, pin: storedPin() }, defaultBase);
    if (category && category !== categoryOf(defaultBase)) query.category = category;
    preferences().set('settings', query);
  } catch {
    // no storage (private window, full or blocked): the settings last as long as the page
  }
}
