// The routes the outing editor proposes to associate.
//
// With a GPS track, the API suggests the routes the track most likely followed, best first (/routes/suggest), once
// per track. Those suggestions are filtered here, at once, on the name typed and on the activities. A search of the
// routes (by name, in the map box) adds the routes below them, when a name is typed or the map is moved. Without a
// track, the search alone gives the routes, as before.
//
// Every request waits for the user to stop typing or moving the map, and only the answer to the last one is used.
import Polyline from 'ol/format/Polyline';
import { LineString } from 'ol/geom';
import { toLonLat } from 'ol/proj';
import { computed, ref, watch } from 'vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import debounce from '@/js/debounce';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// the wait before a request, in ms
export const DEBOUNCE = 300;
// the routes shown first, and how many more each "show more" adds
export const PAGE = 10;
export const MORE = 20;
// the suggestions asked for: the API gives 100 at most
const SUGGESTIONS = 100;
// the routes a search returns
const SEARCH_LIMIT = 50;
// the track is simplified to this tolerance (EPSG:3857 units, about metres), more if it still has too many points:
// the URL must stay under the limits of the servers (~8 KB)
const SIMPLIFY = 20;
const MAX_POINTS = 1000;

const polyline = new Polyline();

// the track of a geom_detail (GeoJSON in EPSG:3857) as an encoded polyline of WGS 84 points, or null without a line
export function encodeTrack(geomDetail: string | null | undefined): string | null {
  let geometry: { type?: string; coordinates?: number[][] | number[][][] };
  try {
    geometry = JSON.parse(geomDetail ?? '');
  } catch {
    return null;
  }
  const lines =
    geometry?.type === 'LineString'
      ? [geometry.coordinates as number[][]]
      : geometry?.type === 'MultiLineString'
        ? (geometry.coordinates as number[][][])
        : [];
  // the days of a multi-day outing joined: the API only needs where the track goes. Without elevation and time.
  const points = lines.flat().map(([x, y]) => [x, y]);
  if (points.length < 2) {
    return null;
  }

  const full = new LineString(points);
  let tolerance = SIMPLIFY;
  let line = full.simplify(tolerance) as LineString;
  while (line.getCoordinates().length > MAX_POINTS) {
    tolerance *= 2;
    line = full.simplify(tolerance) as LineString;
  }
  const lonLat = line.getCoordinates().map((coordinate) => toLonLat(coordinate));
  return polyline.writeGeometry(new LineString(lonLat));
}

// lower case, without accents: "Écrins" matches "ecrins"
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

interface Options {
  // the routes already associated: always shown, never proposed again
  associated: () => C2cDocument[];
  activities: () => string[];
  title: (route: C2cDocument) => string;
}

export function useRouteProposals({ associated, activities, title }: Options) {
  // the name typed by the user
  const text = ref('');
  // the map box (EPSG:3857), null until the map is placed
  const bbox = ref<number[] | null>(null);
  // the suggestions for the track, null without a track
  const suggestions = ref<C2cDocument[] | null>(null);
  const searchResults = ref<C2cDocument[]>([]);
  const searchTotal = ref(0);
  // with suggestions, a search runs once a name is typed or the map moved by the user
  const mapMoved = ref(false);
  const limit = ref(PAGE);

  // the number of the last request: an answer to an older one is dropped
  let lastSuggestion = 0;
  let lastSearch = 0;

  async function suggestNow(geomDetail: string | null | undefined) {
    const request = ++lastSuggestion;
    const track = encodeTrack(geomDetail);
    let found = null;
    if (track) {
      try {
        // the activities are filtered here: changing them needs no request
        found = (await c2c.suggestRoutes(track, { limit: SUGGESTIONS })).data.documents;
      } catch {
        // no suggestions (an API without them, the network): the search gives the routes, as without a track
      }
    }
    if (request === lastSuggestion) {
      suggestions.value = found as C2cDocument[] | null;
      mapMoved.value = false;
      limit.value = PAGE;
      // with suggestions, the search only adds to them; without, it gives the routes again
      await searchNow();
    }
  }

  async function searchNow() {
    const request = ++lastSearch;
    if (!bbox.value || (suggestions.value && !text.value && !mapMoved.value)) {
      searchResults.value = [];
      searchTotal.value = 0;
      return;
    }

    const params: Record<string, string | number> = { limit: SEARCH_LIMIT, bbox: bbox.value.join(',') };
    if (text.value) {
      params.q = text.value;
    }
    if (activities().length) {
      params.act = activities().join(',');
    }

    const { data } = await (c2c.route as DocumentService).getAll(params);
    if (request === lastSearch) {
      const found = data.documents as C2cDocument[];
      searchResults.value = [...found].sort((a, b) => title(a).localeCompare(title(b)));
      searchTotal.value = data.total;
    }
  }

  const suggest = debounce((geomDetail: string | null | undefined) => void suggestNow(geomDetail), DEBOUNCE);
  const search = debounce(() => void searchNow(), DEBOUNCE);

  // the map moved: by the user, or placed by the editor (fromUser false)
  function moveMap(newBbox: number[], fromUser = true) {
    if (newBbox.join(',') === bbox.value?.join(',')) {
      return;
    }
    bbox.value = newBbox;
    mapMoved.value ||= fromUser;
    search();
  }

  // suggestions first (best first), then the routes of the search; each route once, the associated ones apart
  const proposals = computed(() => {
    const seen = new Set(associated().map((route) => route.document_id));
    const wanted = activities();
    const typed = normalize(text.value);
    const result: C2cDocument[] = [];

    for (const route of suggestions.value ?? []) {
      if (
        !seen.has(route.document_id) &&
        (!wanted.length || route.activities?.some((activity) => wanted.includes(activity))) &&
        (!typed || normalize(title(route)).includes(typed))
      ) {
        seen.add(route.document_id);
        result.push(route);
      }
    }
    for (const route of searchResults.value) {
      if (!seen.has(route.document_id)) {
        seen.add(route.document_id);
        result.push(route);
      }
    }
    return result;
  });

  // what the editor lists: the associated routes, then the first proposals
  const routes = computed(() => [...associated(), ...proposals.value.slice(0, limit.value)]);
  const hidden = computed(() => Math.max(proposals.value.length - limit.value, 0));
  // the search found more routes than it returned
  const moreResults = computed(() => searchTotal.value > searchResults.value.length);

  function showMore() {
    limit.value += MORE;
  }

  // a new name or new activities: the list starts short again, the search follows
  watch(text, () => {
    limit.value = PAGE;
    search();
  });
  watch(
    () => activities().join(','),
    () => {
      limit.value = PAGE;
      search();
    }
  );

  return {
    text,
    bbox,
    suggestions,
    routes,
    hidden,
    moreResults,
    showMore,
    moveMap,
    suggest,
    search,
    searchNow,
  };
}
