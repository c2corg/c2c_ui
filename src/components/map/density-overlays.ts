// The "Tracks" (outings) and "Routes" map overlays: below a zoom level each one is an aggregated heatmap, above it the
// individual tracks of the viewport are drawn. Both are fed by the /<documents>/map/{heatmap,tracks} endpoints, which
// take the search filters of the documents listing.

import { markRaw } from 'vue';
import type * as z from 'zod/mini';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { densityHeatmap, densityTracks } from '@/js/apis/c2c/schemas';
import ol from '@/js/libs/ol';

export type DensityType = 'outing' | 'route';

// search filters (the parameters of the documents listing), or none
export type DensityFilters = Record<string, string | number> | null;

// below this zoom level the overlays are heatmaps; at or above it, individual tracks are fetched for the current bbox
export const DENSITY_TRACKS_MIN_ZOOM = 13;
// how long to wait, after the map stops moving, before fetching new overlay data (avoids firing a request on every
// intermediate step of a pan/zoom gesture)
export const DENSITY_FETCH_DEBOUNCE = 400;

export const DENSITY_TYPES: DensityType[] = ['outing', 'route'];

// the answers of the endpoints, once the request is done
export type DensityHeatmap = z.input<typeof densityHeatmap>;
export type DensityTracks = z.input<typeof densityTracks>;

export const DENSITY_OVERLAYS: Record<
  DensityType,
  {
    // translated by the layer switcher
    title: string;
    heatmapGradient: string[];
    trackColor: string;
    getHeatmap: (params: Record<string, unknown>) => ApiData<DensityHeatmap>;
    getTracks: (params: Record<string, unknown>) => ApiData<DensityTracks>;
  }
> = {
  outing: {
    title: 'Tracks',
    heatmapGradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
    trackColor: '#e8412c',
    getHeatmap: (params) => c2c.getOutingsHeatmap(params),
    getTracks: (params) => c2c.getOutingsTracks(params),
  },
  route: {
    title: 'Routes',
    heatmapGradient: ['#9ecae1', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    trackColor: '#1f6fd1',
    getHeatmap: (params) => c2c.getRoutesHeatmap(params),
    getTracks: (params) => c2c.getRoutesTracks(params),
  },
};

// The heatmap layer of an overlay (aggregated density, at low and medium zoom). It is created when the overlay is first
// shown: the layer allocates a canvas for its gradient. OpenLayers objects must not be wrapped in Vue reactive proxies.
export function createHeatmapLayer(type: DensityType) {
  return markRaw(
    new ol.layer.Heatmap({
      source: new ol.source.Vector(),
      blur: 20,
      radius: 12,
      gradient: DENSITY_OVERLAYS[type].heatmapGradient,
      weight: (feature) => feature.get('weight'),
    })
  );
}

// the layers of an overlay that exist from the start: the individual tracks of the viewport (high zoom)
export function createDensityLayers(type: DensityType) {
  return markRaw({
    tracks: markRaw(new ol.layer.Vector({ source: new ol.source.Vector(), visible: false })),
    trackStyle: markRaw(
      new ol.style.Style({ stroke: new ol.style.Stroke({ color: DENSITY_OVERLAYS[type].trackColor, width: 2 }) })
    ),
  });
}

export type DensityLayers = ReturnType<typeof createDensityLayers>;

type DocumentRef = {
  type?: string;
  document_id?: number;
  associations?: { routes?: { document_id?: number }[] };
};

// The filters of the overlays on the map of a document: only what is linked to it is shown.
export function documentOverlayFilters(document: DocumentRef): Record<DensityType, DensityFilters> {
  const id = document.document_id;
  if (id === undefined) {
    return { outing: null, route: null };
  }

  switch (document.type) {
    case 'r':
      return { outing: { r: id }, route: null };
    case 'w':
      return { outing: { w: id }, route: { w: id } };
    case 'a':
      return { outing: { a: id }, route: { a: id } };
    case 'u':
      return { outing: { u: id }, route: null };
    case 'o':
      // only the routes of the outing (an empty list matches nothing)
      return {
        outing: null,
        route: { ids: (document.associations?.routes ?? []).map((route) => route.document_id).join(',') },
      };
    default:
      return { outing: null, route: null };
  }
}

// the parameters of the listing that are not search filters
const NOT_FILTERS = ['offset', 'limit', 'sort', 'bbox', 'pl'];

// The filters of the overlays on the map of the results of a search of `documentType` documents: they follow the
// search filters. The activities are the only filter shared by outings and routes, so they are the only one applied
// to the overlay of the other type.
export function searchOverlayFilters(
  documentType: string,
  query: Record<string, unknown>
): Record<DensityType, DensityFilters> {
  const filters = Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string] => !NOT_FILTERS.includes(entry[0]) && typeof entry[1] === 'string'
    )
  );
  const shared = typeof filters.act === 'string' ? { act: filters.act } : null;

  return {
    outing: documentType === 'outing' ? filters : documentType === 'route' ? shared : null,
    route: documentType === 'route' ? filters : documentType === 'outing' ? shared : null,
  };
}
