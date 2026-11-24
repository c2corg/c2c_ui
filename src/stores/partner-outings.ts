// The outings of the partner sites listed by /metaskirando: the filters (kept in the URL query, so that a list can be
// shared), the last answer of GET /partner-outings, and the state of the request.
import axios from 'axios';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import service, { type PartnerOuting, type PartnerSourceHealth } from '@/js/apis/partner-outings-service';

export type PartnerOutingsFilters = { areas: number[]; activities: string[] };

// the values of a query parameter, comma separated or repeated
function listOf(value: LocationQuery[string] | undefined): string[] {
  return [value ?? []]
    .flat()
    .flatMap((part) => (part ?? '').split(','))
    .map((part) => part.trim())
    .filter(Boolean);
}

export const usePartnerOutingsStore = defineStore('partner-outings', () => {
  const filters = ref<PartnerOutingsFilters>({ areas: [], activities: [] });
  const items = ref<PartnerOuting[]>([]);
  const total = ref(0);
  const sources = ref<PartnerSourceHealth[]>([]);
  // the sources with their site name and url (GET /partner-outings/sources), by source id; the list answer has neither
  const sourceSites = ref<Record<string, PartnerSourceHealth>>({});
  const loading = ref(false);
  const error = ref<unknown>(null);

  let controller: AbortController | null = null;

  // the outings per date (YYYY-MM-DD), the newest date first, the order of the API kept inside a date
  const itemsByDate = computed(() => {
    const groups: Record<string, PartnerOuting[]> = {};
    for (const item of items.value) {
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
        { a: filters.value.areas, act: filters.value.activities, pl: lang },
        current.signal
      );
      if (controller !== current) {
        return;
      }
      items.value = answer.items;
      total.value = answer.total;
      sources.value = answer.sources;
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

  /** Sets the filters from the `a` and `act` parameters of a route query; what is not valid is dropped. */
  function fromRouteQuery(query: LocationQuery) {
    filters.value = {
      areas: listOf(query.a)
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
      activities: listOf(query.act),
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
    itemsByDate,
    load,
    loadSources,
    fromRouteQuery,
    toRouteQuery,
  };
});
