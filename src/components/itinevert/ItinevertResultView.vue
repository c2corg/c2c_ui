<template>
  <div class="section documents-view">
    <html-header :title="getDocumentTypeTitle(documentType)" />
    <div class="search-infos">
      <div class="header-section">
        <span>
          <span class="title is-3 is-ellipsed">
            {{ $filters.uppercaseFirstLetter(getDocumentTypeTitle(documentType)) }}
          </span>
          &nbsp;
          <br class="is-hidden-tablet" />
          <itinevert-page-selector
            :documents="filteredDocuments ?? undefined"
            :limit="limit"
            :offset="offset"
            @paginate="paginatePostNavitiaDocuments"
          />
        </span>
        <span class="is-pulled-right is-flex header-right" v-if="documentType != 'profile'">
          <span @click="toogleProperty('listMode')" class="header-item is-size-3 has-cursor-pointer is-hidden-mobile">
            <fa-icon
              v-show="displayMode !== 'map'"
              icon="th-list"
              :class="listMode ? 'has-text-primary' : ''"
              :title="$gettext('List mode')"
            />
            <fa-icon
              v-show="displayMode !== 'map'"
              icon="th"
              :class="!listMode ? 'has-text-primary' : ''"
              :title="$gettext('Cards mode')"
            />
          </span>
          <template v-if="documentAreGeoLocalized">
            <display-mode-switch
              class="header-item is-hidden-mobile"
              :list-mode="'listMode'"
              :model-value="displayMode"
              @update:model-value="setProperty('displayMode', $event)"
            />

            <span class="is-size-3 is-hidden-tablet">
              <fa-icon
                :icon="displayMode === 'map' ? 'th' : 'map-marked-alt'"
                class="has-text-primary"
                @click="setProperty('displayMode', displayMode === 'map' ? 'both' : 'map')"
              />
            </span>
          </template>
        </span>
      </div>
      <query-items
        class="filter-section"
        :list-mode="Boolean(listMode)"
        :doc-type="documentType"
        :show-print-button="false"
      ></query-items>
    </div>
    <div class="columns result-section" :class="['mobile-mode-' + displayMode, { 'query-has-tags': queryHasTags }]">
      <div
        v-if="showResults"
        class="column documents-container"
        :class="{
          'is-12': !showMap,
          'is-8 is-7-fullhd': showMap && listMode,
          'is-8 is-7-widescreen is-6-fullhd': showMap && !listMode,
        }"
      >
        <loading-notification :promise="promise" />

        <image-cards v-if="filteredDocuments && !listMode && documentType === 'image'" :documents="filteredDocuments" />

        <div
          v-if="filteredDocuments && !listMode && documentType !== 'image'"
          class="columns is-multiline is-variable is-1 cards-list"
        >
          <div
            v-for="(document, index) in filteredDocuments.documents"
            :key="index"
            :class="{
              'is-full-mobile is-half-tablet is-half-desktop is-half-widescreen is-half-fullhd': showMap,
              'is-full-mobile is-one-third-tablet is-one-third-desktop is-one-quarter-widescreen is-one-quarter-fullhd':
                !showMap,
            }"
            class="column card-container"
            @mouseenter="highlightedDocument = document"
            @mouseleave="highlightedDocument = null"
          >
            <document-card :highlighted="highlightedDocument === document" :document="document" target="_blank" />
          </div>
        </div>

        <documents-table
          v-if="listMode"
          :documents="filteredDocuments ?? ({} as Documents)"
          :document-type="documentType"
          :highlighted-document="highlightedDocument ?? undefined"
          :open-in-new-tab="true"
          @highlight-document="highlightedDocument = $event"
          class="documents-table"
        />
      </div>
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="map"
          :documents="documentsShownOnMap"
          :highlighted-document="highlightedDocument"
          :open-in-new-tab="true"
          @highlight-document="highlightedDocument = $event"
          show-filter-control
          show-center-on-geolocation
          show-recenter-on
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import DisplayModeSwitch from '../../views/documents/utils/DisplayModeSwitch.vue';

import ItinevertPageSelector from './ItinevertPageSelector.vue';

import itinevertService, { POLYGON_STYLE, type Query } from '@/js/apis/itinevert-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { getPreferences } from '@/js/vue-plugins/local-storage';
import QueryItems from '@/views/documents/utils/QueryItems.vue';

type Documents = { documents: C2cDocument[]; total: number };
type ResultPromise = { data: unknown; error: unknown; cancel: () => void };

// lazy (ag-grid is big): an async component, as Vue 3 no longer takes a plain function returning the import
const DocumentsTable = defineAsyncComponent(() => import('@/components/datatable/DocumentsTable.vue'));

// stored under the component name, as before: existing preferences are kept
const preferences = getPreferences('ItinevertResultView');

const props = defineProps({
  fields: {
    type: Array,
    default: () => [],
  },
  baseQuery: {
    type: Object,
    default: null,
  },
  documents: {
    type: Object as () => Documents | null,
    default: null,
  },
  documentType: {
    type: String,
    default: '',
  },
  // either the area geometry or the isochrone geometry
  polygonGeometry: {
    type: Object,
    default: null,
  },
  isochroneBbox: {
    type: String,
    default: '',
  },
});

const route = useRoute();
const { $gettext } = useGlobalProperties();

const displayMode = ref('both');
const listMode = ref<boolean | null>(null);
const highlightedDocument = ref<C2cDocument | null>(null);
const filteredDocuments = ref<Documents | null>(null);
const filteredDocumentsBeforePagination = ref<Documents | null>(null);
const queryHasTags = ref(false);
const offset = ref(0);
const limit = ref(30);
const promise = ref<ResultPromise | Record<string, never>>({});
const map = useTemplateRef<{ map: { updateSize(): void } }>('map');

const showMap = computed(() => ['both', 'map'].includes(displayMode.value));
const showResults = computed(() => ['result', 'both'].includes(displayMode.value));
const documentAreGeoLocalized = computed(
  () =>
    (constants.objectDefinitions as unknown as Record<string, { geoLocalized?: boolean }>)[props.documentType]
      .geoLocalized === true
);
const documentsShownOnMap = computed(() => {
  const mapDocuments: C2cDocument[] = [];
  if (props.polygonGeometry !== null) {
    // create an area document based on polygon geometry
    const areaDocument = {
      document_id: -1, // synthetic ID to avoid conflicts with real documents
      type: 'a',
      geometry: {
        version: 1,
        geom: JSON.stringify(props.polygonGeometry),
        geom_detail: JSON.stringify(props.polygonGeometry),
      },
      properties: {
        ...POLYGON_STYLE,
        nonInteractive: true,
      },
    };
    mapDocuments.push(areaDocument);
  }
  if (filteredDocuments.value) {
    return filteredDocuments.value?.documents?.concat(mapDocuments);
  } else {
    return props.documents?.documents?.concat(mapDocuments);
  }
});

// the display preferences: list or cards, map or not
const displayProperties = { listMode, displayMode } as const;
type DisplayProperty = keyof typeof displayProperties;

function setProperty(property: DisplayProperty, value: unknown) {
  (displayProperties[property] as { value: unknown }).value = value;
  preferences.set(`${props.documentType}.${property}`, value);
}

function toogleProperty(property: DisplayProperty) {
  setProperty(property, !displayProperties[property].value);
}

function getDocumentTypeTitle(documentType: string) {
  return $gettext(documentType + 's');
}

// when map container is resized (which happen when displayMode switchs between both and map),
// openLayer need an explicit resize
watch(displayMode, (newValue, oldValue) => {
  if ((newValue === 'map' && oldValue === 'both') || (newValue === 'both' && oldValue === 'map')) {
    nextTick(() => map.value!.map.updateSize());
  }
});

function paginatePostNavitiaDocuments(pagination: [number, number]) {
  offset.value = pagination[0];
  limit.value = pagination[1];
  // whenever a filter is applied, check if offset is < then total
  if (offset.value > filteredDocuments.value!.total) {
    offset.value = Math.max(filteredDocuments.value!.total - limit.value, 0);
  }

  // apply pagination
  filteredDocuments.value = {
    documents: filteredDocumentsBeforePagination.value!.documents.slice(offset.value, offset.value + limit.value),
    total: filteredDocuments.value!.total,
  };
}

function filterPostNavitiaDocuments(newQuery: Query) {
  const paginateDoc = () => {
    const filtered = filteredDocuments.value!;
    filtered.total = filtered.documents.length;

    filteredDocumentsBeforePagination.value = filtered;

    // whenever a filter is applied, check if offset is < then total
    if (offset.value > filtered.total) {
      offset.value = Math.max(filtered.total - limit.value, 0);
    }

    // apply pagination
    filteredDocuments.value = {
      documents: filtered.documents.slice(offset.value, offset.value + limit.value),
      total: filtered.total,
    };
  };

  let query = itinevertService.enhanceQuery(props.baseQuery, newQuery);
  if (props.isochroneBbox !== '' && !query.bbox) {
    query.bbox = props.isochroneBbox;
  }

  let needToQuery = false;
  // working with routes
  // the base query has activites choosen during form step
  // there is no need to query if no extra filters are set
  // extra filters being other filters (not act), or when you unselect a base activity
  // if you add more activites than base, we do not query still, since this will never show more documents than all post navitia documents
  if (props.baseQuery['act']) {
    if (Object.keys(newQuery).length === 1) {
      // no activities selected and no extra filters, so we display all documents
      needToQuery = false;
    } else if (Object.keys(newQuery).length > 2) {
      needToQuery = true;
    } else {
      const newQueryAct = (newQuery['act'] as string | undefined)?.split(',') ?? [];
      const baseQueryAct = (props.baseQuery['act'] as string | undefined)?.split(',') ?? [];

      // check if all new activites match base activities
      for (const activity of baseQueryAct) {
        if (!newQueryAct.includes(activity)) {
          needToQuery = true;
        }
      }
    }
  } else {
    // working with waypoints
    // the base query has no filters
    // there is no need to query if no extra filters are set
    needToQuery = Object.keys(newQuery).length !== 1; // (1 because documentType)
  }

  // if no need to query, we just display base documents
  if (!needToQuery) {
    // no filters set → display all documents
    filteredDocuments.value = {
      documents: props.documents!.documents,
      total: props.documents!.total,
    };
    paginateDoc();
    if (promise.value) {
      promise.value.cancel?.();
      promise.value.data = filteredDocuments.value;
    }
  } else {
    // Select API function based on document type
    const functionToFetch =
      props.documentType === 'route'
        ? itinevertService.getAllReachableRoutes
        : itinevertService.getAllReachableWaypoints;

    // get list of previous document IDs
    const oldIds = props.documents?.documents?.map((doc) => doc.document_id) ?? [];

    // reset filtered list
    filteredDocuments.value!.documents = [];

    // cancel ongoing promise
    promise.value?.cancel?.();

    // remove undefined values
    query = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined));

    // launch new API request
    const p = functionToFetch.call(itinevertService, query);

    // activate loader
    const loader: ResultPromise = {
      data: null,
      error: null,
      cancel: p.cancel,
    };
    promise.value = loader;

    p.then((data) => {
      // fill loader data (hides loader)
      promise.value.data = data;

      // filter only matching old IDs
      for (const item of data as C2cDocument[]) {
        if (oldIds.includes(item.document_id)) {
          filteredDocuments.value!.documents.push(item);
        }
      }

      paginateDoc();
    }).catch((err) => {
      promise.value.error = err;
    });
  }
}

watch(
  () => route.query,
  (newQuery) => filterPostNavitiaDocuments(newQuery)
);

onMounted(() => {
  // init filtered documents
  if (!props.documents) {
    filteredDocuments.value = { documents: [], total: 0 };
    filteredDocumentsBeforePagination.value = { documents: [], total: 0 };
    promise.value = { data: filteredDocuments.value, error: null, cancel: () => {} };
    return;
  }
  filteredDocumentsBeforePagination.value = {
    documents: props.documents.documents,
    total: props.documents.total,
  };
  filteredDocuments.value = {
    documents: props.documents.documents.slice(offset.value, offset.value + limit.value),
    total: props.documents.total,
  };
  promise.value = {
    data: filteredDocuments.value,
    error: null,
    cancel: () => {},
  };
});
</script>

<style scoped lang="scss">
$section-padding: 1.5rem;
$header-height: 34px;
$header-padding-bottom: 1.5rem;
$filter-height: 32px;
$tags-height: 28px;
$filter-padding-bottom: 0.5rem;
// prettier-ignore
$result-height: calc(
  100vh - #{$navbar-height} - 2 * #{$section-padding} - #{$header-height} - #{$header-padding-bottom} - #{$filter-padding-bottom} - #{$filter-height}
);
// prettier-ignore
$result-height-with-tags: calc(
  100vh - #{$navbar-height} - 2 * #{$section-padding} - #{$header-height} - #{$header-padding-bottom} - #{$filter-padding-bottom} - #{$filter-height} - #{$tags-height}
);
$cards-gap: 0.25rem;

.header-section {
  padding-bottom: $header-padding-bottom;
}

.header-right {
  align-items: center;
}

.header-item:not(:first-child) {
  margin-bottom: 0;
  margin-left: 0.75rem;
}

.filter-section {
  padding-bottom: $filter-padding-bottom;
  clear: both;
}

@media screen and (max-width: $tablet) {
  $mobile-section-padding: 0.5rem;
  $mobile-header-height: 56px;
  $mobile-filters-height: 25px;

  .search-infos {
    position: fixed;
    top: calc($navbar-height + $itinevert-header-height);
    left: 0;
    right: 0;
    z-index: 24;
    background-color: $body-background-color;
    padding-top: $mobile-section-padding;
  }

  .result-section {
    padding-top: calc($navbar-height + $itinevert-header-height + 3.75rem);
  }

  .documents-view {
    padding-top: $mobile-section-padding;
    padding-left: 0;
    padding-right: 0;
    padding-bottom: 0;
  }

  .filter-section,
  .header-section {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-bottom: $mobile-section-padding;
  }

  .header-right {
    line-height: 1em;
  }

  .map-container {
    height: $result-height;
    padding: 0;
  }

  .mobile-mode-map {
    margin-top: 0;
    .map-container {
      height: calc(
        100vh - #{$navbar-height} - 3 * #{$mobile-section-padding} - #{$mobile-header-height} -
          #{$mobile-filters-height}
      );
    }

    .documents-container {
      display: none;
    }
  }

  .mobile-mode-result,
  .mobile-mode-both {
    .map-container {
      visibility: hidden; // map does not like to be in a display none...
    }
  }
}

@media screen and (min-width: $tablet) {
  .result-section {
    margin-top: 0;
    height: $result-height;

    &.query-has-tags {
      height: $result-height-with-tags;
    }

    .documents-container {
      height: 100%;
      overflow: auto;
      padding-top: 0;
      padding-bottom: 0;

      .cards-list {
        padding-top: 2px;
        height: 100%;
      }

      .documents-table {
        height: 100%;
      }
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
