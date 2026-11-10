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

          <near-me-button v-if="documentAreGeoLocalized" class="header-item" />

          <!-- "My topos" (src/stores/offline.ts): the page saved at once, and the ones of the page saved offline -->
          <template v-if="SAVABLE_TYPES.includes(documentType)">
            <bulk-offline-button
              class="header-item"
              :documents="documents?.documents ?? []"
              :document-type="documentType"
            />
            <span
              class="header-item is-size-3 has-cursor-pointer"
              :title="$gettext('Only the ones saved offline')"
              @click="offlineOnly = !offlineOnly"
            >
              <fa-icon icon="circle-check" :class="offlineOnly ? 'has-text-primary' : 'has-text-grey-light'" />
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

import BulkOfflineButton from './utils/BulkOfflineButton.vue';
import DisplayModeSwitch from './utils/DisplayModeSwitch.vue';
import ImageCards from './utils/ImageCards.vue';
import LoadUserPreferencesButton from './utils/LoadUserPreferencesButton.vue';
import NearMeButton from './utils/NearMeButton.vue';
import PageSelector from './utils/PageSelector.vue';
import QueryItems from './utils/QueryItems.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { usePullRefresh } from '@/js/composables/pull-refresh';
import constants from '@/js/constants';
import bus from '@/js/event-bus';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { getPreferences } from '@/js/vue-plugins/local-storage';
import { SAVABLE_TYPES } from '@/pwa/offline-store';
import { useOfflineStore } from '@/stores/offline';

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
const offline = useOfflineStore();
const offlineOnly = ref(false);
// the documents of the page, or the ones of them saved offline
const documents = computed(() => {
  const data = promise.value.data;
  return offlineOnly.value && data
    ? {
        ...data,
        documents: data.documents.filter((document: C2cDocument) =>
          offline.isOfflineReady(documentType.value, document.document_id!)
        ),
      }
    : data;
});
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

usePullRefresh(() => {
  load();
  return promise.value;
});

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
    nextTick(() => olMap.value?.map.updateSize());
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

<style scoped>
@import '@/assets/css/media.css';

/*
 * The heights: section padding 1.5rem, header 34px with a bottom padding of 1.5rem, filters 32px with a bottom
 * padding of 0.5rem, tags 28px. On mobile: section padding 0.5rem, header 56px, filters 25px.
 */

.header-section {
  padding-bottom: 1.5rem;
}

.header-right {
  align-items: center;
}

.header-item:not(:first-child) {
  margin-bottom: 0;
  margin-left: 0.75rem;
}

.filter-section {
  padding-bottom: 0.5rem;
  clear: both;
}

@media screen and (--c2c-max-tablet) {
  .search-infos {
    position: fixed;
    top: var(--c2c-navbar-height);
    left: 0;
    right: 0;
    z-index: 24;
    background-color: var(--c2c-body-background-color);
    padding-top: 0.5rem;
  }

  .result-section {
    padding-top: calc(2 * 0.5rem + 56px + 25px);
  }

  .documents-view {
    padding-top: 0.5rem;
    padding-left: 0;
    padding-right: 0;
    padding-bottom: 0;
  }

  .filter-section,
  .header-section {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .header-right {
    line-height: 1em;
  }

  .map-container {
    height: calc(100vh - var(--c2c-navbar-height) - 2 * 1.5rem - 34px - 1.5rem - 0.5rem - 32px);
    padding: 0;
  }

  .mobile-mode-map {
    margin-top: 0;
    .map-container {
      height: calc(100vh - var(--c2c-navbar-height) - 3 * 0.5rem - 56px - 25px);
    }

    .documents-container {
      display: none;
    }
  }

  .mobile-mode-result,
  .mobile-mode-both {
    .map-container {
      visibility: hidden; /* map does not like to be in a display none... */
    }
  }
}

@media screen and (--c2c-min-tablet) {
  .result-section {
    margin-top: 0;
    height: calc(100vh - var(--c2c-navbar-height) - 2 * 1.5rem - 34px - 1.5rem - 0.5rem - 32px);

    &.query-has-tags {
      height: calc(100vh - var(--c2c-navbar-height) - 2 * 1.5rem - 34px - 1.5rem - 0.5rem - 32px - 28px);
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

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): the header of the listing on the dark page */
html[data-theme='dark'] .search-infos {
  background-color: #1a1a1a;
}
</style>
