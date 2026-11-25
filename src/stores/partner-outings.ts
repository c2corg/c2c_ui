// The outings of the partner sites listed by /metaskirando: the filters (kept in the URL query, so that a list can be
// shared), the last answer of GET /partner-outings, and the state of the request.
import axios from 'axios';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import service, { type PartnerOuting, type PartnerSourceHealth } from '@/js/apis/partner-outings-service';
import { createVisitTracker } from '@/views/portals/metaskirando/new-since-visit';
import { filterByText, toId } from '@/views/portals/metaskirando/text-filter';

// `bbox`: the extent of the map, [xmin, ymin, xmax, ymax] in EPSG:3857, or null
// `steep`: only the steep outings (`steep=1` in the URL)
// `sources`: the sources to list, 'c2c' included; none means all of them
// `q`: a text the loaded outings must hold: it filters on the client, the API does not see it
export type PartnerOutingsFilters = {
  areas: number[];
  activities: string[];
  bbox: number[] | null;
  steep: boolean;
  sources: string[];
  q: string;
};

export const emptyFilters = (): PartnerOutingsFilters => ({
  areas: [],
  activities: [],
  bbox: null,
  steep: false,
  sources: [],
  q: '',
});

// the values of a query parameter, comma separated or repeated
function listOf(value: LocationQuery[string] | undefined): string[] {
  return [value ?? []]
    .flat()
    .flatMap((part) => (part ?? '').split(','))
    .map((part) => part.trim())
    .filter(Boolean);
}

// the four numbers of a bbox parameter, null when it is not one
function bboxOf(value: LocationQuery[string] | undefined): number[] | null {
  const bbox = listOf(value).map(Number);
  return bbox.length === 4 && bbox.every(Number.isFinite) && bbox[0] < bbox[2] && bbox[1] < bbox[3] ? bbox : null;
}

export const usePartnerOutingsStore = defineStore('partner-outings', () => {
  const filters = ref<PartnerOutingsFilters>(emptyFilters());
  const items = ref<PartnerOuting[]>([]);
  const total = ref(0);
  const sources = ref<PartnerSourceHealth[]>([]);
  // the sources with their site name and url (GET /partner-outings/sources), by source id; the list answer has neither
  const sourceSites = ref<Record<string, PartnerSourceHealth>>({});
  const loading = ref(false);
  const error = ref<unknown>(null);

  let controller: AbortController | null = null;

  // "new since last visit": the ids of the outings that no visit of their source showed before
  const tracker = createVisitTracker();
  const newIds = ref<string[]>([]);
  const onlyNew = ref(false);

  // the outings the filters keep: the loaded ones, narrowed by the text and, when asked, to the new ones
  const visibleItems = computed(() =>
    filterByText(items.value, filters.value.q).filter((item) => !onlyNew.value || newIds.value.includes(item.id))
  );

  // the sources to offer as chips: c2c, the sources of the registry, and those the filter names
  const sourceIds = computed(() => [
    ...new Set([
      'c2c',
      ...Object.keys(sourceSites.value),
      ...sources.value.map((source) => source.source),
      ...filters.value.sources,
    ]),
  ]);

  // the outings per date (YYYY-MM-DD), the newest date first, the order of the API kept inside a date
  const itemsByDate = computed(() => {
    const groups: Record<string, PartnerOuting[]> = {};
    for (const item of visibleItems.value) {
      (groups[item.date] ??= []).push(item);
    }
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0)));
  });

  /** Loads the outings of the filters. A request still running is aborted: its answer never reaches the state. */
  async function load(lang?: string) {
    controller?.abort();
    const current = (controller = new AbortController());
    loading.value = true;
    error.value = null;
    try {
      const answer = await service.getAll(
        {
          a: filters.value.areas,
          act: filters.value.activities,
          bbox: filters.value.bbox ?? undefined,
          steep: filters.value.steep || undefined,
          sources: filters.value.sources.length ? filters.value.sources : undefined,
          pl: lang,
        },
        current.signal
      );
      if (controller !== current) {
        return;
      }
      items.value = answer.items;
      total.value = answer.total;
      sources.value = answer.sources;
      tracker.observe(answer.items);
      newIds.value = answer.items.filter(tracker.isNew).map((item) => item.id);
    } catch (e) {
      // replaced by a newer load (or aborted by it): that one owns the state
      if (controller !== current || axios.isCancel(e)) {
        return;
      }
      error.value = e;
      items.value = [];
      total.value = 0;
    } finally {
      if (controller === current) {
        loading.value = false;
        controller = null;
      }
    }
  }

  /** Loads the site name and url of the sources; the footer falls back to the ids when this fails. */
  async function loadSources() {
    try {
      const list = await service.getSources();
      sourceSites.value = Object.fromEntries(list.map((source) => [source.source, source]));
    } catch {
      // only the names of the sources: the list shows without them
    }
  }

  /** Turns a source on or off in the chips. All of them on is no filter: `sources` is then empty, and never all off. */
  function toggleSource(source: string) {
    const all = sourceIds.value;
    const selected = filters.value.sources.length ? filters.value.sources : all;
    const next = selected.includes(source) ? selected.filter((s) => s !== source) : [...selected, source];
    filters.value = {
      ...filters.value,
      sources: next.length === 0 || all.every((s) => next.includes(s)) ? [] : all.filter((s) => next.includes(s)),
    };
  }

  /**
   * Sets the filters from the parameters of a route query (`a`, `act`, `bbox`, `steep`, `sources`, `q`); what is not
   * valid is dropped.
   */
  function fromRouteQuery(query: LocationQuery) {
    filters.value = {
      areas: listOf(query.a)
        .map(toId)
        .filter((id): id is number => id !== null),
      activities: listOf(query.act),
      bbox: bboxOf(query.bbox),
      steep: listOf(query.steep).some((value) => ['1', 'true', 'on'].includes(value.toLowerCase())),
      sources: listOf(query.sources),
      q: (Array.isArray(query.q) ? query.q[0] : query.q)?.trim() ?? '',
    };
  }

  /** The route query of the filters: the empty ones are left out. */
  function toRouteQuery(): LocationQueryRaw {
    const query: Record<string, string> = {};
    if (filters.value.areas.length) {
      query.a = filters.value.areas.join(',');
    }
    if (filters.value.activities.length) {
      query.act = filters.value.activities.join(',');
    }
    if (filters.value.bbox) {
      query.bbox = filters.value.bbox.join(',');
    }
    if (filters.value.steep) {
      query.steep = '1';
    }
    if (filters.value.sources.length) {
      query.sources = filters.value.sources.join(',');
    }
    if (filters.value.q) {
      query.q = filters.value.q;
    }
    return query;
  }

  return {
    filters,
    items,
    total,
    sources,
    sourceSites,
    loading,
    error,
    visibleItems,
    itemsByDate,
    sourceIds,
    newIds,
    onlyNew,
    toggleSource,
    load,
    loadSources,
    fromRouteQuery,
    toRouteQuery,
  };
});
