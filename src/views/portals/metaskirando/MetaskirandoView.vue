<template>
  <div class="section metaskirando">
    <html-header :title="$gettext('Metaskirando')" />
    <div class="search-infos">
      <div class="header-section">
        <h1 class="title is-3">
          <fa-icon icon="mountain" />
          {{ $gettext('Metaskirando') }}
        </h1>
        <span class="is-flex header-right">
          <display-mode-switch
            class="header-item is-hidden-mobile"
            :model-value="displayMode"
            @update:model-value="setDisplayMode"
          />
          <button
            type="button"
            class="button is-small header-item is-hidden-tablet"
            data-test="map-toggle"
            :title="displayMode === 'map' ? $gettext('Show results') : $gettext('Show the map')"
            :aria-label="displayMode === 'map' ? $gettext('Show results') : $gettext('Show the map')"
            @click="setDisplayMode(displayMode === 'map' ? 'both' : 'map')"
          >
            <fa-icon :icon="displayMode === 'map' ? 'th' : 'map-marked-alt'" class="has-text-primary" />
          </button>
        </span>
      </div>
      <p class="subtitle is-6">{{ $gettext('Outings from other sites') }}</p>

      <div class="filters">
        <input-document
          v-model="areas"
          document-type="area"
          multiple
          clear-input-on-toggle
          @update:model-value="onFilter"
        />
        <div v-if="areas.length" class="tags selected-areas" data-test="areas">
          <span v-for="area of areas" :key="area.document_id" class="tag is-medium">
            <document-title :document="area" />
            <button type="button" class="delete is-small" :aria-label="$gettext('Remove')" @click="removeArea(area)" />
          </span>
        </div>
        <input-activity v-model="activities" @update:model-value="onFilter" />
      </div>
    </div>

    <div
      class="columns result-section"
      :class="['mobile-mode-' + displayMode, displayMode === 'map' ? 'fills-window' : 'fills-window-from-tablet']"
    >
      <div
        v-if="showResults"
        ref="list"
        class="column documents-container"
        :class="showMap ? 'is-8 is-7-widescreen' : 'is-12'"
      >
        <div v-if="store.loading" class="loading has-text-centered" data-test="loading">
          <spinner-icon />
        </div>
        <div v-else-if="store.error" class="notification is-danger is-light" data-test="error">
          {{ $gettext('An error occurred, please try again') }}
        </div>
        <p v-else-if="store.items.length === 0" class="has-text-centered is-italic empty" data-test="empty">
          {{ $gettext('No outing for these filters') }}
        </p>
        <div v-else>
          <p v-if="withoutLocation" class="is-size-7 is-italic without-location" data-test="without-location">
            {{ withoutLocationText }}
          </p>
          <div v-for="(outings, date) of store.itemsByDate" :key="date" data-test="day">
            <p class="outing-date-header is-4 is-italic has-text-weight-bold" data-test="date">
              {{ $filters.uppercaseFirstLetter($dateUtils.toLocalizedString(date, '@1')) }}
            </p>
            <div class="dashboard-list">
              <partner-outing-row
                v-for="outing of outings"
                :key="outing.id"
                :outing="outing"
                :data-outing-id="outing.id"
                :class="{ 'is-highlighted': outing.id === highlightedId, 'is-selected': outing.id === selectedId }"
                @mouseenter="highlightedId = outing.id"
                @mouseleave="highlightedId = null"
              />
            </div>
          </div>
        </div>

        <hr />
        <ul class="sources is-size-7" data-test="sources">
          <li v-for="source of store.sources" :key="source.source" :class="{ 'has-text-danger': !isHealthy(source) }">
            <a v-if="site(source).url" :href="site(source).url" target="_blank" rel="noopener external">
              <strong>{{ site(source).name }}</strong>
            </a>
            <strong v-else>{{ site(source).name }}</strong>:
            <template v-if="isHealthy(source) && source.last_success_at">
              {{ $gettext('Last updated {time}').replace('{time}', $dateUtils.timeAgo(source.last_success_at)) }}
            </template>
            <template v-else>{{ $gettext('Source unavailable') }}</template>
          </li>
        </ul>
      </div>
      <div v-if="showMap" class="column map-container">
        <partner-outings-map
          ref="map"
          :markers="markers"
          :highlighted-id="highlightedId"
          :filter-by-extent="filterByExtent"
          :initial-extent="initialExtent"
          @highlight="highlightedId = $event"
          @select="onSelect"
          @extent-change="onExtentChange"
          @update:filter-by-extent="onFilterByExtent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import PartnerOutingRow from './PartnerOutingRow.vue';
import PartnerOutingsMap from './PartnerOutingsMap.vue';
import { markersOf } from './partner-outings-map';

import { VIEW_URL_KEY } from '@/components/map/map-url-keys';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import type { PartnerSourceHealth } from '@/js/apis/partner-outings-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { usePartnerOutingsStore } from '@/stores/partner-outings';
import DisplayModeSwitch from '@/views/documents/utils/DisplayModeSwitch.vue';

const { $gettext, $language } = useGlobalProperties();
const route = useRoute();
const router = useRouter();
const store = usePartnerOutingsStore();

// the selected areas as documents (the filter of the store keeps their ids), and the activities
const areas = ref<C2cDocument[]>([]);
const activities = ref<string[]>([]);

// what the page shows, as the lists of documents do (DocumentsView): the results, the map or both. On a phone the map is
// under the results when both are shown. Written in the URL (view=map), but for the default
const DISPLAY_MODES = ['result', 'both', 'map'];
const displayMode = ref('both');
const showMap = computed(() => ['both', 'map'].includes(displayMode.value));
const showResults = computed(() => ['result', 'both'].includes(displayMode.value));

const mapComponent = useTemplateRef<{ resize(): void }>('map');
const list = useTemplateRef<HTMLElement>('list');

// the outing under the pointer, in the list or on the map, and the one a click on its marker brought to the list
const highlightedId = ref<string | null>(null);
const selectedId = ref<string | null>(null);

// the map filters the outings with its extent (bbox of the URL, in EPSG:3857) when asked to, or when the link has one
const filterByExtent = ref(false);
// the extent of the link, where the map opens
const initialExtent = ref<number[] | null>(null);

const located = computed(() => markersOf(store.items));
const markers = computed(() => located.value.markers);
const withoutLocation = computed(() => located.value.withoutLocation);
const withoutLocationText = computed(() =>
  withoutLocation.value === 1
    ? $gettext('1 outing without location')
    : $gettext('{n} outings without location').replace('{n}', String(withoutLocation.value))
);

function readDisplayMode() {
  const view = String(route.query[VIEW_URL_KEY] ?? '');
  displayMode.value = DISPLAY_MODES.includes(view) ? view : 'both';
}

function setDisplayMode(value: string) {
  displayMode.value = value;
  writeQuery();
  // the map was hidden or resized
  nextTick(() => mapComponent.value?.resize());
}

// a click on a marker: the row comes into view, when the list is shown
function onSelect(id: string) {
  highlightedId.value = id;
  selectedId.value = id;
  const row = [...(list.value?.querySelectorAll<HTMLElement>('[data-outing-id]') ?? [])].find(
    (element) => element.dataset.outingId === id
  );
  row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(() => selectedId.value === id && (selectedId.value = null), 2000);
}

// the extent of the map changed: the outings of the extent, with a pause for a map being dragged
let extentTimer: ReturnType<typeof setTimeout> | undefined;
function onExtentChange(extent: number[]) {
  clearTimeout(extentTimer);
  extentTimer = setTimeout(() => {
    store.filters = { ...store.filters, bbox: extent };
    writeQuery();
    reload();
  }, 300);
}

function onFilterByExtent(value: boolean) {
  filterByExtent.value = value;
  if (!value) {
    clearTimeout(extentTimer);
    store.filters = { ...store.filters, bbox: null };
    writeQuery();
    reload();
  }
}

// the query of the filters (a list can be shared) and the display mode
function writeQuery() {
  const view = displayMode.value === 'both' ? undefined : displayMode.value;
  router.replace({ query: { ...store.toRouteQuery(), [VIEW_URL_KEY]: view } });
}

// a source that answered recently enough to be shown
const isHealthy = (source: PartnerSourceHealth) => ['ok', 'degraded'].includes(source.status);

// the name of a source, linked to its site, from the list of sources; the id when that did not load
function site(source: PartnerSourceHealth) {
  const info = store.sourceSites[source.source];
  return { name: info?.site_name ?? source.site_name ?? source.source, url: info?.site_url };
}

function removeArea(area: C2cDocument) {
  areas.value = areas.value.filter((a) => a.document_id !== area.document_id);
  return onFilter();
}

function reload() {
  return store.load($language?.current);
}

// the areas of the query that the input does not hold yet; the id stands for the title of one that cannot be read
async function loadAreas() {
  const missing = store.filters.areas.filter((id) => !areas.value.some((area) => area.document_id === id));
  const loaded = await Promise.all(
    missing.map(async (id) => {
      try {
        return (await (c2c.area as DocumentService).get(id)).data as unknown as C2cDocument;
      } catch {
        return { document_id: id, type: 'a', locales: [{ lang: 'en', title: `#${id}` }] } as C2cDocument;
      }
    })
  );
  areas.value = [...areas.value.filter((area) => store.filters.areas.includes(area.document_id!)), ...loaded];
}

function syncFromRoute() {
  store.fromRouteQuery(route.query);
  readDisplayMode();
  filterByExtent.value = store.filters.bbox !== null;
  initialExtent.value ??= store.filters.bbox;
  activities.value = [...store.filters.activities];
  loadAreas();
  return reload();
}

// a filter changed: the query follows (a list can be shared), and the outings load again
function onFilter() {
  store.filters = {
    areas: areas.value.map((area) => area.document_id!),
    activities: [...activities.value],
    bbox: store.filters.bbox,
  };
  writeQuery();
  return reload();
}

// the back button, or a link: only when the query is not the one of the filters
watch(
  () => route.query,
  (query) => {
    readDisplayMode();
    const current = JSON.stringify(store.toRouteQuery());
    store.fromRouteQuery(query);
    if (JSON.stringify(store.toRouteQuery()) !== current) {
      syncFromRoute();
    }
  }
);

onMounted(() => {
  store.loadSources();
  return syncFromRoute();
});
</script>

<style scoped>
@import '@/assets/css/media.css';

/* The results and the map share what the header leaves of the window, as in the lists of documents (DocumentsView):
   from the tablet width the list scrolls in its column; on phones the page scrolls, and the map alone fills the window */

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-section .title {
  margin-bottom: 0;
}

.header-item:not(:first-child) {
  margin-left: 0.75rem;
}

.filters {
  margin-bottom: var(--c2c-size-6);
}

.selected-areas {
  margin-top: var(--c2c-size-7);
}

.outing-date-header {
  margin-top: var(--c2c-size-6);
  margin-bottom: var(--c2c-size-7);
  border-bottom: solid var(--c2c-color-base-c2c) 2px;
}

.empty,
.loading {
  margin: var(--c2c-size-6) 0;
}

.without-location {
  color: var(--c2c-grey-light);
}

.dashboard-list > :nth-child(2n + 1) {
  background-color: var(--c2c-body-background-color);
}

.partner-outing-row.is-highlighted {
  background-color: var(--c2c-grey-lighter);
}

.partner-outing-row.is-selected {
  outline: 2px solid var(--c2c-primary);
}

.sources > li {
  color: var(--c2c-grey-light);
}

@media screen and (--c2c-max-tablet) {
  .section.metaskirando {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .map-container {
    padding: 0;
  }

  .mobile-mode-map {
    margin-top: 0;

    .map-container {
      height: 100%;
    }
  }

  .mobile-mode-result,
  .mobile-mode-both {
    .map-container {
      /* a map does not like display none: hidden, without height */
      visibility: hidden;
      height: 0;
      min-height: 0;
      overflow: hidden;
    }
  }
}

@media screen and (--c2c-min-tablet) {
  .result-section {
    margin-top: 0;
    margin-bottom: 0;

    .documents-container {
      height: 100%;
      overflow: auto;
      padding-top: 0;
    }

    .map-container {
      min-height: 100%;
      padding-left: 0;
      padding-top: 0;
      padding-bottom: 0;
    }
  }
}
</style>
