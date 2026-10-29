<template>
  <div class="section documents-view">
    <html-header :title="getDocumentTypeTitle(documentType)" />
    <div class="search-infos">
      <div class="header-section">
        <span>
          <dropdown-button class="header-item">
            <template #button>
              <span>
                <span class="title is-3 is-ellipsed">
                  {{ $filters.uppercaseFirstLetter(getDocumentTypeTitle(documentType)) }}
                </span>
                <fa-icon icon="angle-down" aria-hidden="true" />
              </span>
            </template>
            <router-link
              v-for="type of documentTypes"
              :key="type"
              class="dropdown-item is-size-6"
              :class="{ 'is-active': type === documentType }"
              :to="{ name: type + 's', query: queryWithoutOffsetAndSort }"
            >
              <icon-document :document-type="type" />
              <span>&nbsp;{{ $filters.uppercaseFirstLetter(getDocumentTypeTitle(type)) }}</span>
            </router-link>
          </dropdown-button>
          &nbsp;
          <br class="is-hidden-tablet" />
          <page-selector :documents="documents" />
        </span>
        <span class="is-pulled-right is-flex header-right" v-if="documentType != 'profile'">
          <load-user-preferences-button class="is-hidden-mobile" />

          <span @click="setListMode(!listMode)" class="header-item is-size-3 has-cursor-pointer is-hidden-mobile">
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
              :list-mode="listMode"
              :model-value="displayMode"
              @update:model-value="setDisplayMode"
            />

            <span class="is-size-3 is-hidden-tablet">
              <fa-icon
                :icon="displayMode === 'map' ? 'th' : 'map-marked-alt'"
                class="has-text-primary"
                @click="setDisplayMode(displayMode === 'map' ? 'both' : 'map')"
              />
            </span>
          </template>
        </span>
      </div>

      <query-items class="filter-section" :list-mode="listMode" @documents-load="onQueryDocumentsLoad" />
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

        <image-cards v-if="documents && !listMode && documentType === 'image'" :documents="documents" />

        <div
          v-if="documents && !listMode && documentType !== 'image'"
          class="columns is-multiline is-variable is-1 cards-list"
        >
          <div
            v-for="(document, index) in documents.documents"
            :key="index"
            :class="{
              'is-full-mobile is-half-tablet is-half-desktop is-half-widescreen is-half-fullhd': showMap,
              'is-full-mobile is-one-third-tablet is-one-third-desktop is-one-quarter-widescreen is-one-quarter-fullhd':
                !showMap,
            }"
            class="column card-container"
            @mouseenter="highlightedDocument = document"
            @mouseleave="highlightedDocument = undefined"
          >
            <document-card :highlighted="highlightedDocument === document" :document="document" />
          </div>
        </div>

        <documents-table
          v-if="listMode"
          :documents="documents ? documents : {}"
          :document-type="documentType"
          :highlighted-document="highlightedDocument"
          @highlight-document="highlightedDocument = $event"
          class="documents-table"
        />
      </div>
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="olMap"
          :documents="documentsShownOnMap"
          :highlighted-document="highlightedDocument"
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
import { computed, defineAsyncComponent, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import DisplayModeSwitch from './utils/DisplayModeSwitch.vue';
import ImageCards from './utils/ImageCards.vue';
import LoadUserPreferencesButton from './utils/LoadUserPreferencesButton.vue';
import PageSelector from './utils/PageSelector.vue';
import QueryItems from './utils/QueryItems.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import bus from '@/js/event-bus';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { getPreferences } from '@/js/vue-plugins/local-storage';

// lazy (ag-grid is big): an async component, as Vue 3 no longer takes a plain function returning the import
const DocumentsTable = defineAsyncComponent(() => import('@/components/datatable/DocumentsTable.vue'));

// stored under the component name, as before: existing preferences are kept
const preferences = getPreferences('DocumentsView');

const documentTypes = ['route', 'waypoint', 'outing', 'image', 'book', 'area'];

const route = useRoute();
const router = useRouter();
const { $gettext } = useGlobalProperties();

// the map component: OpenLayers needs an explicit resize when its container changes
const olMap = useTemplateRef<{ map: { updateSize(): void } }>('olMap');

const promise = ref<ApiData | { data?: undefined }>({});
const displayMode = ref('both');
const listMode = ref(false);
const highlightedDocument = ref<C2cDocument>();
const filteredWaypoints = ref<C2cDocument[]>([]);
const queryHasTags = ref(false);

const showMap = computed(() => ['both', 'map'].includes(displayMode.value));
const showResults = computed(() => ['result', 'both'].includes(displayMode.value));
const documents = computed(() => promise.value.data);
const documentType = computed(() => String(route.name).slice(0, -1));
const documentAreGeoLocalized = computed(() => constants.objectDefinitions[documentType.value].geoLocalized === true);

const queryWithoutOffsetAndSort = computed(() => {
  const result = Object.assign({}, route.query);
  delete result.offset;
  delete result.sort;

  return result;
});

const documentsShownOnMap = computed(() =>
  filteredWaypoints.value.concat(documents.value ? documents.value.documents : [])
);

function load() {
  displayMode.value = preferences.get(
    documentType.value + '.displayMode',
    documentAreGeoLocalized.value ? 'both' : 'result'
  ) as string;
  listMode.value = preferences.get(documentType.value + '.listMode', false) as boolean;

  if (route.hash) {
    // keep compatible with v6 AngularJs hacks...
    router.replace(route.fullPath.replace('#', '?'));
    // the route watcher will call load
    return;
  }

  promise.value = (c2c as unknown as Record<string, DocumentService>)[documentType.value]
    .getAll(route.query)
    .then(() => {
      // the list has its height: back from a document, the router can restore the scroll position
      bus.emit('trigger-scroll');
    });
}

// the display preferences, per document type
function setListMode(value: boolean) {
  listMode.value = value;
  preferences.set(`${documentType.value}.listMode`, value);
}

function setDisplayMode(value: string) {
  displayMode.value = value;
  preferences.set(`${documentType.value}.displayMode`, value);
}

function getDocumentTypeTitle(documentType: string) {
  return $gettext(documentType + 's');
}

// when map container is resized (which happen when displayMode switchs between both and map),
// openLayer need an explicit resize
function updateMapSize(newValue: string, oldValue: string) {
  if ((newValue === 'map' && oldValue === 'both') || (newValue === 'both' && oldValue === 'map')) {
    nextTick(() => olMap.value!.map.updateSize());
  }
}

function onQueryDocumentsLoad(documents: C2cDocument[]) {
  queryHasTags.value = documents.length > 0;
  filteredWaypoints.value = documents.filter((document) => document.type === 'w');

  // do not display waypoints associated
  filteredWaypoints.value.forEach((document) => delete document.associations);
}

watch(() => route.fullPath, load, { immediate: true });
watch(displayMode, updateMapSize);
</script>

<style scoped lang="scss">
$section-padding: 1.5rem; //TODO find this variable
$header-height: 34px;
$header-padding-bottom: 1.5rem; //TODO find this variable
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
    top: $navbar-height;
    left: 0;
    right: 0;
    z-index: 24;
    background-color: $body-background-color;
    padding-top: $mobile-section-padding;
  }

  .result-section {
    padding-top: calc(2 * #{$mobile-section-padding} + #{$mobile-header-height} + #{$mobile-filters-height});
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
