// The settings of a document map kept in the URL of its page (?layer=ign&slopes=ign,swiss&overlays=outing,route&pin=top),
// so that they survive a reload, a new tab and a shared link. Only what differs from the default is written, with short
// stable ids rather than the titles of the layers (which are translated keys and may change with the map engine).

import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import { DENSITY_TYPES, type DensityType } from './density-overlays';
import { baseLayers, slopeLayers } from './map-layers';

export type MapUrlState = {
  base: string;
  slopes: string[];
  overlays: DensityType[];
  // false when the protection areas are hidden (they are shown by default where offered)
  protection: boolean;
  // '' when the map is not pinned
  pin: string;
};

export const PIN_SIDES = ['top', 'right'];

// the ids are part of the URLs people share: never change one
const BASE_IDS: Record<string, string> = {
  OpenTopoMap: 'otm',
  'ESRI World Imagery': 'esri',
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

export const MAP_URL_KEYS = ['layer', 'slopes', 'overlays', 'protection', 'pin'];

const invert = (ids: Record<string, string>) => Object.fromEntries(Object.entries(ids).map(([k, v]) => [v, k]));
const baseTitles = invert(BASE_IDS);
const slopeTitles = invert(SLOPE_IDS);

const first = (value: LocationQuery[string] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';
const list = (value: LocationQuery[string] | undefined) =>
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
