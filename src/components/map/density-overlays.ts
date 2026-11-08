// The "Tracks" (outings) and "Routes" map overlays: below a zoom level each one is an aggregated heatmap, above it the
// individual tracks of the viewport are drawn. Both are fed by the /<documents>/map/{heatmap,tracks} endpoints, which
// take the search filters of the documents listing.

import { markRaw } from 'vue';
import type * as z from 'zod/mini';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { densityHeatmap, densityTrack, densityTracks } from '@/js/apis/c2c/schemas';
import ol from '@/js/libs/ol';
import utils from '@/js/utils';

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
const HEATMAP_RADIUS = 6;
const HEATMAP_BLUR = 10;

// The weight of a cell of the heatmap, from 0 to 1. A logarithm: with a linear scale, the busiest place makes the
// other ones, which have a tenth of its outings, almost disappear.
export function heatmapWeight(count: number, maxCount: number) {
  return Math.log1p(count) / Math.log1p(Math.max(maxCount, 1));
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
    getHeatmap: (params: Record<string, unknown>) => ApiData<DensityHeatmap>;
    getTracks: (params: Record<string, unknown>) => ApiData<DensityTracks>;
  }
> = {
  outing: {
    title: 'Outings',
    // the orange and the blue of the site: a pair that is told apart by the colorblind (not a red on a green and brown
    // map), each on a casing of its own, light or dark. The heatmaps go from light to dark.
    heatmapGradient: ['#fff1d6', '#ffd18a', '#ff9933', '#d9640a', '#8a3a00'],
    trackColor: '#ff9933',
    casingColor: '#2b2b2b',
    getHeatmap: (params) => c2c.getOutingsHeatmap(params),
    getTracks: (params) => c2c.getOutingsTracks(params),
  },
  route: {
    title: 'Routes',
    heatmapGradient: ['#deebf7', '#9ecae1', '#4292c6', '#2171b5', '#08306b'],
    trackColor: '#337ab7',
    casingColor: '#ffffff',
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
      blur: HEATMAP_BLUR,
      radius: HEATMAP_RADIUS,
      gradient: DENSITY_OVERLAYS[type].heatmapGradient,
      weight: (feature) => feature.get('weight'),
    })
  );
}

// a track: its color, on a wider line of another color around it
function trackStyle(type: DensityType, casingWidth: number, width: number) {
  const { casingColor, trackColor } = DENSITY_OVERLAYS[type];
  return [
    new ol.style.Style({ stroke: new ol.style.Stroke({ color: casingColor, width: casingWidth }) }),
    new ol.style.Style({ stroke: new ol.style.Stroke({ color: trackColor, width }) }),
  ];
}

// the layers of an overlay that exist from the start: the individual tracks of the viewport (high zoom)
export function createDensityLayers(type: DensityType) {
  return markRaw({
    tracks: markRaw(new ol.layer.Vector({ source: new ol.source.Vector(), visible: false })),
    trackStyle: markRaw(trackStyle(type, 4.5, 2.5)),
    // under the pointer
    trackHighlightedStyle: markRaw(trackStyle(type, 8, 4.5)),
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

// the track of an outing or a route as a GPX file, as the buttons of the page of the document do
export async function downloadTrackGpx(track: DensityTrack) {
  const [{ default: GPX }, { default: GeoJSON }] = await Promise.all([
    import('ol/format/GPX'),
    import('ol/format/GeoJSON'),
  ]);

  const feature = new GeoJSON().readFeatures(track.geometry.geom_detail)[0];
  if (!feature) {
    return;
  }

  const name = track.title ?? '';
  feature.set('name', name);

  let filename = `${track.document_id}_${name.substring(0, 100)}`;
  if (track.date_start) {
    filename += `_${track.date_start}`;
  }

  const content = new GPX().writeFeatures([feature], { featureProjection: 'EPSG:3857' });
  utils.download(content, `${filename}.gpx`, 'application/gpx+xml;charset=utf-8');
}
