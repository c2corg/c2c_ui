// The "Tracks" (outings) and "Routes" map overlays: below a zoom level each one is an aggregated heatmap, above it the
// individual tracks of the viewport are drawn. Both are fed by the /<documents>/map/{heatmap,tracks} endpoints, which
// take the search filters of the documents listing.

import type { ExpressionSpecification, LayerSpecification } from 'maplibre-gl';
import type * as z from 'zod/mini';

import { LINE_CASING_WIDTH, LINE_HIGHLIGHTED_CASING_WIDTH, LINE_HIGHLIGHTED_WIDTH, LINE_WIDTH } from './map-documents';
import { MAP_URL_KEYS } from './map-url-keys';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { densityHeatmap, densityTrack, densityTracks } from '@/js/apis/c2c/schemas';

export type DensityType = 'outing' | 'route';

// search filters (the parameters of the documents listing), or none
export type DensityFilters = Record<string, string | number> | null;

// below this zoom level the overlays are heatmaps; at or above it, individual tracks are fetched for the current bbox
export const DENSITY_TRACKS_MIN_ZOOM = 13;
// how long to wait, after the map stops moving, before fetching new overlay data (avoids firing a request on every
// intermediate step of a pan/zoom gesture)
export const DENSITY_FETCH_DEBOUNCE = 400;

export const DENSITY_TYPES: DensityType[] = ['outing', 'route'];

// the size of a point of the heatmap and of its blur, in pixels: the cells of the grid of the API are a few pixels
const HEATMAP_RADIUS = 8;
const HEATMAP_BLUR = 6;

/**
 * The box to ask the API for, from the box of the view: the view, grown to the lines of a grid whose cells are a
 * quarter to an eighth of its width (a power of two, so the lines are the same for every view of about that size).
 * Small moves of the map give the same box, so the same request: the one already shown, or the one the browser and the
 * proxies keep (the API says they can). The box is at most one and a half times as wide as the view.
 */
export function snapExtent(extent: number[]): number[] {
  const [xmin, ymin, xmax, ymax] = extent;
  const width = xmax - xmin;
  if (!(width > 0)) {
    return extent;
  }

  const step = 2 ** Math.floor(Math.log2(width / 4));
  return [
    Math.floor(xmin / step) * step,
    Math.floor(ymin / step) * step,
    Math.ceil(xmax / step) * step,
    Math.ceil(ymax / step) * step,
  ];
}

// The weight of a cell of the heatmap, from 0 to 1. It is also its opacity, so the weight of a place with a single
// outing must be enough to see it: with a logarithm from 0, the busiest place of a wide view (tens of thousands of
// outings) leaves all the others at a few percent, transparent. A logarithm, because with a linear scale the other
// places, which have a tenth of its outings, almost disappear; above a floor, so that none does.
const HEATMAP_MIN_WEIGHT = 0.4;

export function heatmapWeight(count: number, maxCount: number) {
  if (count <= 0) {
    return 0;
  }
  return HEATMAP_MIN_WEIGHT + ((1 - HEATMAP_MIN_WEIGHT) * Math.log1p(count)) / Math.log1p(Math.max(count, maxCount, 1));
}

// the answers of the endpoints, once the request is done
export type DensityHeatmap = z.input<typeof densityHeatmap>;
export type DensityTracks = z.input<typeof densityTracks>;
export type DensityTrack = z.input<typeof densityTrack>;

export const DENSITY_OVERLAYS: Record<
  DensityType,
  {
    // translated by the layer switcher
    title: string;
    heatmapGradient: string[];
    trackColor: string;
    // the line around the track, so that it can be seen on any background: whatever the colors one sees
    casingColor: string;
    // `signal` cancels the request
    getHeatmap: (params: Record<string, unknown>, signal?: AbortSignal) => ApiData<DensityHeatmap>;
    getTracks: (params: Record<string, unknown>, signal?: AbortSignal) => ApiData<DensityTracks>;
  }
> = {
  outing: {
    title: 'Outings',
    // the orange and the blue of the site: a pair that is told apart by the colorblind (not a red on a green and brown
    // map), each on a casing of its own, light or dark. The heatmaps go from light to dark.
    heatmapGradient: ['#ffcf8a', '#ffab4d', '#ff8a1f', '#d9540a', '#8a3a00'],
    trackColor: '#ff9933',
    casingColor: '#2b2b2b',
    getHeatmap: (params, signal) => c2c.getOutingsHeatmap(params, signal),
    getTracks: (params, signal) => c2c.getOutingsTracks(params, signal),
  },
  route: {
    title: 'Routes',
    heatmapGradient: ['#a9cfe8', '#6baed6', '#3b8bc4', '#1f5fa6', '#08306b'],
    trackColor: '#337ab7',
    casingColor: '#ffffff',
    getHeatmap: (params, signal) => c2c.getRoutesHeatmap(params, signal),
    getTracks: (params, signal) => c2c.getRoutesTracks(params, signal),
  },
};

// the gradient of a heatmap, its transparency following the density as the OpenLayers heatmap did
const heatmapColor = (gradient: string[]): ExpressionSpecification => [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(0, 0, 0, 0)',
  ...gradient.flatMap((color, i) => {
    const density = (i + 1) / gradient.length;
    const [r, g, b] = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16));
    return [density, `rgba(${r}, ${g}, ${b}, ${density})`];
  }),
];

const trackLayers = (id: string, type: DensityType, casingWidth: number, width: number): LayerSpecification[] => {
  const { casingColor, trackColor } = DENSITY_OVERLAYS[type];
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const;
  return [
    {
      id: `${id}-casing`,
      type: 'line',
      source: id,
      layout,
      paint: { 'line-color': casingColor, 'line-width': casingWidth },
    },
    { id: `${id}-line`, type: 'line', source: id, layout, paint: { 'line-color': trackColor, 'line-width': width } },
  ];
};

/**
 * The layers of an overlay, hidden at first: its density (heatmap, at low and medium zoom), under its tracks (high
 * zoom), a track on a wider line of another color around it. Sources: heatmap-<type> (points with a weight) and
 * tracks-<type>.
 */
export const densityLayers = (type: DensityType): LayerSpecification[] => [
  {
    id: `heatmap-${type}`,
    type: 'heatmap',
    source: `heatmap-${type}`,
    layout: { visibility: 'none' },
    paint: {
      'heatmap-weight': ['get', 'weight'],
      // the OpenLayers heatmap drew discs of the radius with a blur around them: MapLibre draws a gaussian, wider and
      // stronger to look the same
      'heatmap-radius': 1.2 * (HEATMAP_RADIUS + HEATMAP_BLUR),
      'heatmap-intensity': 1.4,
      // translucent, to see the map through it
      'heatmap-opacity': 0.66,
      'heatmap-color': heatmapColor(DENSITY_OVERLAYS[type].heatmapGradient),
    },
  },
  ...trackLayers(`tracks-${type}`, type, LINE_CASING_WIDTH, LINE_WIDTH).map(
    (layer) => ({ ...layer, layout: { ...layer.layout, visibility: 'none' } }) as LayerSpecification
  ),
];

/** The track under the pointer, drawn again on top, thicker, in the colors of its overlay (source: track-highlight) */
export const trackHighlightLayers = (): LayerSpecification[] =>
  DENSITY_TYPES.flatMap((type) =>
    trackLayers('track-highlight', type, LINE_HIGHLIGHTED_CASING_WIDTH, LINE_HIGHLIGHTED_WIDTH).map(
      (layer) => ({ ...layer, id: `${layer.id}-${type}`, filter: ['==', ['get', 'type'], type] }) as LayerSpecification
    )
  );

type DocumentRef = {
  type?: string;
  document_id?: number;
  activities?: string[] | null;
  associations?: { routes?: { document_id?: number }[] };
};

// The filters of the overlays on the map of a document:
// - a route: its outings, and the routes of its activities around it;
// - an outing: the other outings of its routes (it can have several), and these routes;
// - a waypoint or an area: what is in it.
// `null` is no filter: all the documents of the box.
export function documentOverlayFilters(document: DocumentRef): Record<DensityType, DensityFilters> {
  const id = document.document_id;
  if (id === undefined) {
    return { outing: null, route: null };
  }

  switch (document.type) {
    case 'r':
      return { outing: { r: id }, route: document.activities?.length ? { act: document.activities.join(',') } : null };
    case 'w':
      return { outing: { w: id }, route: { w: id } };
    case 'a':
      return { outing: { a: id }, route: { a: id } };
    case 'u':
      return { outing: { u: id }, route: null };
    case 'o': {
      const routes = (document.associations?.routes ?? [])
        .map((route) => route.document_id)
        .filter((routeId): routeId is number => typeof routeId === 'number');
      return {
        // the outings of any of these routes. Without a route there is nothing to compare with: `ids` with an empty
        // list matches nothing (`r` with an empty list would match everything)
        outing: routes.length ? { r: routes.join(',') } : { ids: '' },
        route: { ids: routes.join(',') },
      };
    }
    default:
      return { outing: null, route: null };
  }
}

// the parameters of the listing that are not search filters (the settings of the map are in its URL too)
const NOT_FILTERS = ['offset', 'limit', 'sort', 'bbox', 'pl', ...MAP_URL_KEYS];

// The filters that mean the same for outings and routes: the activities, the areas, the waypoints, the users and the
// ratings (the ones of an outing are the ones of its route). The others (the title, the dates, the quality...) are
// those of the documents searched, not of the other ones.
const SHARED_FILTERS = [
  'act',
  'a',
  'w',
  'u',
  'dhei',
  'erat',
  'frat',
  'grat',
  'hrat',
  'irat',
  'krat',
  'lrat',
  'mbdr',
  'mbur',
  'prat',
  'trat',
  'wrat',
];

// The filters of the overlays on the map of the results of a search of `documentType` documents: they follow the
// search filters. The overlay of the other type only gets the filters they have in common, and the routes of the
// outings searched when they are those of given routes.
export function searchOverlayFilters(
  documentType: string,
  query: Record<string, unknown>
): Record<DensityType, DensityFilters> {
  const filters = Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string] => !NOT_FILTERS.includes(entry[0]) && typeof entry[1] === 'string'
    )
  );
  const shared: Record<string, string> = Object.fromEntries(
    Object.entries(filters).filter(([name]) => SHARED_FILTERS.includes(name))
  );
  const hasShared = Object.keys(shared).length > 0;

  if (documentType === 'outing') {
    // the outings of given routes: these routes
    const routes = filters.r ? { ...shared, ids: filters.r } : shared;
    return { outing: filters, route: hasShared || filters.r ? routes : null };
  }
  if (documentType === 'route') {
    return { outing: hasShared ? shared : null, route: filters };
  }
  return { outing: null, route: null };
}

// The tracks in the order they are listed: the routes first, by title (there are fewer of them), then the outings,
// the most recent ones first.
export function sortTracks<T extends Pick<DensityTrack, 'type' | 'title' | 'date_end' | 'document_id'>>(
  tracks: T[]
): T[] {
  const rank = (track: T) => (track.type === 'o' ? 1 : 0);

  return [...tracks].sort((a, b) => {
    if (rank(a) !== rank(b)) {
      return rank(a) - rank(b);
    }
    if (a.type === 'o') {
      // ISO dates: the text order is the date one
      return (b.date_end ?? '').localeCompare(a.date_end ?? '') || b.document_id - a.document_id;
    }
    return (a.title ?? '').localeCompare(b.title ?? '') || a.document_id - b.document_id;
  });
}
