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
          <page-selector :key="documentType" :documents="documents" />
        </span>
        <span class="is-pulled-right is-flex header-right" v-if="documentType != 'profile'">
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
              :model-value="displayMode"
              @update:model-value="setDisplayMode"
            />

            <button
              type="button"
              class="button is-small header-item is-hidden-tablet"
              :title="displayMode === 'map' ? $gettext('Show results') : $gettext('Show the map')"
              :aria-label="displayMode === 'map' ? $gettext('Show results') : $gettext('Show the map')"
              @click="setDisplayMode(displayMode === 'map' ? 'both' : 'map')"
            >
              <fa-icon :icon="displayMode === 'map' ? 'th' : 'map-marked-alt'" class="has-text-primary" />
            </button>
          </template>

          <near-me-button v-if="documentAreGeoLocalized" class="header-item" />
        </span>
      </div>

      <query-items class="filter-section" :list-mode="listMode" @documents-load="onQueryDocumentsLoad" />
    </div>

    <div
      ref="resultSection"
      class="columns result-section"
      :class="[
        'mobile-mode-' + displayMode,
        { 'query-has-tags': queryHasTags, 'has-splitter': showSplitter, 'is-resizing': splitter.resizing.value },
      ]"
    >
      <div
        v-if="showResults"
        ref="documentsContainer"
        class="column documents-container"
        :class="{
          'is-12': !showMap,
          'is-8 is-7-widescreen': showMap && listMode,
          'is-8 is-6-widescreen': showMap && !listMode,
          'has-custom-width': hasCustomWidth,
        }"
        :style="hasCustomWidth ? { '--results-width': `${splitter.width.value}%` } : undefined"
      >
        <loading-notification :promise="promise" />

        <image-cards
          v-if="documents && !listMode && documentType === 'image'"
          :documents="documents"
          class="documents-image-cards"
        />

        <div
          v-if="documents && !listMode && documentType !== 'image'"
          class="columns is-multiline is-variable is-1 cards-list"
        >
          <div
            v-for="(document, index) in documents.documents"
            :key="index"
            :class="{
              'is-full': showMap && cardsSingleColumn,
              'is-full-mobile is-half-tablet': showMap && !cardsSingleColumn,
              'is-full-mobile is-one-third-tablet is-one-quarter-widescreen': !showMap,
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

        <page-navigation v-if="documents" :documents="documents" class="documents-navigation" />
      </div>
      <div
        v-if="showSplitter"
        class="results-splitter"
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        :aria-label="$gettext('Resize the map')"
        :aria-valuenow="splitter.valueNow.value"
        :aria-valuemin="MIN_RESULTS_WIDTH"
        :aria-valuemax="MAX_RESULTS_WIDTH"
        :title="$gettext('Drag to resize the map, double-click to reset')"
        @pointerdown="splitter.onPointerDown"
        @keydown="splitter.onKeydown"
        @dblclick="splitter.reset"
      />
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="olMap"
          :documents="documentsShownOnMap"
          :highlighted-document="highlightedDocument"
          :tracks-filters="overlayFilters.outing"
          :routes-filters="overlayFilters.route"
          sync-url
          @highlight-document="highlightedDocument = $event"
          :show-filter-control="displayMode !== 'map' || $screen.isMobile"
          show-center-on-geolocation
          show-recenter-on
          show3d
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
import NearMeButton from './utils/NearMeButton.vue';
import PageNavigation from './utils/PageNavigation.vue';
import PageSelector from './utils/PageSelector.vue';
import QueryItems from './utils/QueryItems.vue';
import { normalizedPageQuery } from './utils/page-query';
import { MAX_RESULTS_WIDTH, MIN_RESULTS_WIDTH, useResultsSplitter } from './utils/results-splitter';

import { searchOverlayFilters } from '@/components/map/density-overlays';
import { VIEW_URL_KEY, withoutDisplaySettings } from '@/components/map/map-url-keys';
import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { usePullRefresh } from '@/js/composables/pull-refresh';
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
const { $gettext, $screen } = useGlobalProperties();

// the map component: OpenLayers needs an explicit resize when its container changes
const olMap = useTemplateRef<{ resize(): void }>('olMap');
// the list scrolls in its own container on large screens, which the router knows nothing about
const documentsContainer = useTemplateRef<HTMLElement>('documentsContainer');

const promise = ref<ApiData | { data?: undefined }>({});
const displayMode = ref('both');
const listMode = ref(false);
const highlightedDocument = ref<C2cDocument>();
const filteredWaypoints = ref<C2cDocument[]>([]);
const queryHasTags = ref(false);

const showMap = computed(() => ['both', 'map'].includes(displayMode.value));
const showResults = computed(() => ['result', 'both'].includes(displayMode.value));

// on desktop, the results and the map share the width as the user drags it, one width for the list and one for the
// cards, for all the document types
const resultSection = useTemplateRef<HTMLElement>('resultSection');
const splitter = useResultsSplitter({
  preferences,
  key: computed(() => (listMode.value ? 'resultsListWidth' : 'resultsGridWidth')),
  row: resultSection,
  results: documentsContainer,
  onResize: () => olMap.value?.resize(),
});
const showSplitter = computed(() => showResults.value && showMap.value && !$screen.isMobile && !$screen.isTablet);
const hasCustomWidth = computed(() => showSplitter.value && splitter.width.value !== undefined);
// narrowed results: one card per row instead of two (the default widths always fit two)
const CARDS_SINGLE_COLUMN_BELOW = 640;
const cardsSingleColumn = computed(
  () => hasCustomWidth.value && (splitter.pixelWidth.value ?? Infinity) < CARDS_SINGLE_COLUMN_BELOW
);
const documents = computed(() => promise.value.data);
const documentType = computed(() => String(route.name).slice(0, -1));
const documentAreGeoLocalized = computed(() => constants.objectDefinitions[documentType.value].geoLocalized === true);

const queryWithoutOffsetAndSort = computed(() => {
  const result = Object.assign({}, route.query);
  delete result.offset;
  delete result.sort;

  return result;
});

// the search filters: the query of the page, but for how it is shown (the view, the settings of the map)
const searchQuery = computed(() => withoutDisplaySettings(route.query));
// the page the results are those of: how they are shown does not change them
const searchKey = computed(() => JSON.stringify([route.path, searchQuery.value, route.hash]));

// the "Tracks" and "Routes" overlays of the map follow the search
const overlayFilters = computed(() => searchOverlayFilters(documentType.value, route.query));

const documentsShownOnMap = computed(() =>
  filteredWaypoints.value.concat(documents.value ? documents.value.documents : [])
);

usePullRefresh(() => {
  load();
  return promise.value;
});

// what the list shows: what its URL says (a shared link, back), else the preference of this document type. The
// documents without a location only have their results
const DISPLAY_MODES = ['result', 'both', 'map'];
function readDisplayMode() {
  const fromUrl = String(route.query[VIEW_URL_KEY] ?? '');
  if (!documentAreGeoLocalized.value) {
    displayMode.value = 'result';
  } else if (DISPLAY_MODES.includes(fromUrl)) {
    displayMode.value = fromUrl;
  } else {
    displayMode.value = preferences.get(documentType.value + '.displayMode', 'both') as string;
  }
}

function load() {
  readDisplayMode();
  listMode.value = preferences.get(documentType.value + '.listMode', false) as boolean;

  if (route.hash) {
    // keep compatible with v6 AngularJs hacks...
    router.replace(route.fullPath.replace('#', '?'));
    // the route watcher will call load
    return;
  }

  // offset in the middle of a page (old link...): go to the page it belongs to before loading anything
  const pageQuery = normalizedPageQuery(route, null);
  if (pageQuery) {
    router.replace(pageQuery);
    // the route watcher will call load
    return;
  }

  const requested = searchKey.value;
  promise.value = (c2c as unknown as Record<string, DocumentService>)[documentType.value]
    .getAll(searchQuery.value)
    .then((response) => {
      // past the last page, which happens when the map is moved to a sparser area: show the last page instead
      const lastPageQuery = normalizedPageQuery(route, response.data.total);
      if (lastPageQuery && searchKey.value === requested) {
        router.replace(lastPageQuery);
        // the route watcher will call load
        return;
      }

      // the list has its height: back from a document, the router can restore the scroll position
      bus.emit('trigger-scroll');
    });
}

// as soon as another page is asked for, not once its results are loaded
function scrollResultsToTop() {
  if (documentsContainer.value) {
    documentsContainer.value.scrollTop = 0;
  }
}

// the display preferences, per document type
function setListMode(value: boolean) {
  listMode.value = value;
  preferences.set(`${documentType.value}.listMode`, value);
}

// kept for this document type, and in the URL of the list to share it (the page is the same: replaced, not added to the
// history), but for the default view
function setDisplayMode(value: string) {
  displayMode.value = value;
  preferences.set(`${documentType.value}.displayMode`, value);
  const view = value === 'both' ? undefined : value;
  if (view !== route.query[VIEW_URL_KEY]) router.replace({ query: { ...route.query, [VIEW_URL_KEY]: view } });
}

function getDocumentTypeTitle(documentType: string) {
  return $gettext(documentType + 's');
}

// when map container is resized (which happen when displayMode switchs between both and map),
// openLayer need an explicit resize
function updateMapSize(newValue: string, oldValue: string) {
  if ((newValue === 'map' && oldValue === 'both') || (newValue === 'both' && oldValue === 'map')) {
    nextTick(() => olMap.value?.resize());
  }
}

function onQueryDocumentsLoad(documents: C2cDocument[]) {
  queryHasTags.value = documents.length > 0;
  filteredWaypoints.value = documents.filter((document) => document.type === 'w');

  // do not display waypoints associated
  filteredWaypoints.value.forEach((document) => delete document.associations);
}

watch(searchKey, load, { immediate: true });
watch(displayMode, updateMapSize);
watch(() => route.query[VIEW_URL_KEY], readDisplayMode);
watch(() => [route.query.offset, route.query.limit], scrollResultsToTop);
</script>

<style scoped>
@import '@/assets/css/media.css';

/*
 * On mobile the search bars stick on top, under the ad when there is one, and the map height is calculated: section
 * padding 0.5rem, header 56px, filters 25px.
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

/* the page selector (PageSelector.vue) hides its "per page" choice when the header is narrow. Until Chrome 129, Firefox 133
   and Safari 18.4, a container is also a stacking context: the header takes a level above the map (its controls go up
   to 4), else the map covers the menus of the header (near me, filters). Under the site notice (20, App.vue) */
.search-infos {
  container: documents-header / inline-size;
  position: relative;
  z-index: 10;
}

.filter-section {
  padding-bottom: 0.5rem;
  clear: both;
}

@media screen and (--c2c-max-tablet) {
  /* sticky, not fixed: a fixed bar would hide the top of the ad, which is in the flow above the page */
  .search-infos {
    position: sticky;
    top: var(--c2c-header-height);
    z-index: 24;
    background-color: var(--c2c-body-background-color);
    padding-top: 0.5rem;
  }

  .documents-view {
    padding-top: 0;
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
    height: calc(100vh - var(--c2c-header-height) - 2 * 1.5rem - 34px - 1.5rem - 0.5rem - 32px);
    padding: 0;
  }

  .mobile-mode-map {
    margin-top: 0;
    .map-container {
      height: calc(100vh - var(--c2c-header-height) - 3 * 0.5rem - 56px - 25px);
    }

    .documents-container {
      display: none;
    }
  }

  .mobile-mode-result,
  .mobile-mode-both {
    .map-container {
      /* map does not like to be in a display none: hidden and without height, so that it leaves no blank page under the list */
      visibility: hidden;
      height: 0;
      overflow: hidden;
    }
  }
}

@media screen and (--c2c-min-tablet) {
  /*
   * The app is as high as the window and the results take what is left under the header and the filters, whatever
   * their height (the filters can wrap on two lines) and what comes above (the top bar, with or without the ad bar).
   * The list scrolls in its container, and the pagination stays below it.
   */
  :global(#app:has(.documents-view)) {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  :global(#app:has(.documents-view) .page-content) {
    flex: 1 1 0;
    min-height: 0;
  }

  .documents-view {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .search-infos {
    flex: 0 0 auto;
  }

  .result-section {
    margin-top: 0;
    margin-bottom: 0;
    flex: 1 1 0;
    min-height: 0;

    .documents-container {
      height: 100%;
      overflow: auto;
      display: flex;
      flex-direction: column;
      padding-top: 0;
      padding-bottom: 0;

      .cards-list {
        padding-top: 2px;
      }

      .cards-list,
      .documents-image-cards {
        flex: 0 0 auto;
      }

      /* the table scrolls by itself: it takes the room left by the navigation */
      .documents-table {
        flex: 1 1 0;
        min-height: 0;
      }

      .documents-navigation {
        flex: 0 0 auto;
      }
    }

    .map-container {
      min-height: 100%;
      padding-left: 0;
      padding-top: 0;
      padding-bottom: 0;
    }

    /* the splitter takes most of the gutter between the results and the map: by default, the widths do not change */
    &.has-splitter .documents-container {
      padding-right: 0.25rem;
    }

    .documents-container.has-custom-width {
      flex: none;
      width: var(--results-width);
      /* one card, or a few columns of the table, whatever the width of the screen the width was chosen on */
      min-width: 20rem;
    }

    .results-splitter {
      flex: 0 0 0.5rem;
      position: relative;
      cursor: col-resize;
      touch-action: none;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(50% - 1px);
        width: 2px;
        border-radius: 1px;
        background-color: var(--c2c-grey-lighter);
        transition: background-color 0.15s;
      }

      &:hover::after,
      &:focus-visible::after {
        background-color: var(--c2c-primary);
      }
    }

    &.is-resizing {
      cursor: col-resize;
      user-select: none;

      .results-splitter::after {
        background-color: var(--c2c-primary);
      }
    }
  }
}
</style>
