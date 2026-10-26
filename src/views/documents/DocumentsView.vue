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
          <span
            v-if="hasTransportContext"
            class="header-item verify-accessibility-batch tooltip-container"
            :data-tooltip="!canVerifyBatch && !batchVerifying ? 'top' : null"
          >
            <button
              type="button"
              class="button is-small is-primary"
              :disabled="!canVerifyBatch || batchVerifying"
              @click="verifyBatchAccessibility"
            >
              <fa-icon v-if="batchVerifying" icon="circle-notch" spin aria-hidden="true" />
              <span v-else>
                {{ $gettext('Check schedules') }}
                <template v-if="documents">({{ documentsToVerify.length }})</template>
              </span>
            </button>
            <span v-if="!canVerifyBatch" class="tooltip">
              {{
                durationUnknownCount
                  ? $gettext(
                      'The schedules of the documents of this page are already checked, or cannot be checked because the duration of the route is unknown'
                    )
                  : $gettext('The schedules of the documents of this page are already checked')
              }}
            </span>
            <span v-if="batchError" class="batch-error">{{ $gettext('Unable to check schedules right now.') }}</span>
          </span>

          <load-user-preferences-button class="is-hidden-mobile" />

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
              list-mode="listMode"
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
          <template v-for="(document, index) in documents.documents" :key="index">
            <p v-if="index === firstDurationUnknownIndex" class="column is-full duration-unknown-heading">
              {{ durationUnknownNotice }}
            </p>
            <div
              :class="{
                'is-full-mobile is-half-tablet is-half-desktop is-half-widescreen is-half-fullhd': showMap,
                'is-full-mobile is-one-third-tablet is-one-third-desktop is-one-quarter-widescreen is-one-quarter-fullhd':
                  !showMap,
              }"
              class="column card-container"
              @mouseenter="highlightedDocument = document"
              @mouseleave="highlightedDocument = null"
            >
              <document-card
                :highlighted="highlightedDocument === document"
                :document="document"
                :transport-context="transportContext"
              />
            </div>
          </template>
        </div>

        <p v-if="listMode && durationUnknownCount" class="duration-unknown-heading">
          {{ durationUnknownNotice }}
        </p>

        <documents-table
          v-if="listMode"
          :documents="documents ? documents : {}"
          :document-type="documentType"
          :highlighted-document="highlightedDocument"
          :transport-context="transportContext"
          @highlight-document="highlightedDocument = $event"
          class="documents-table"
        />
      </div>
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="map"
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

<script>
import { defineAsyncComponent } from 'vue';

import DisplayModeSwitch from './utils/DisplayModeSwitch';
import ImageCards from './utils/ImageCards';
import LoadUserPreferencesButton from './utils/LoadUserPreferencesButton';
import PageSelector from './utils/PageSelector';
import QueryItems from './utils/QueryItems';

import c2c from '@/js/apis/c2c';
import itinevertService, { MAX_ROUTE_THRESHOLD, buildIsochroneOverlayDocuments } from '@/js/apis/itinevert-service';
import navitiaService from '@/js/apis/navitia-service';
import constants from '@/js/constants';
import bus from '@/js/event-bus';
import { isDurationUnknown } from '@/js/transport-accessibility';
import { hasTransportQuery, parseTransportQuery, transportSearchKey } from '@/js/transport-query';
import { getPreferences } from '@/js/vue-plugins/local-storage';

// lazy (ag-grid is big): an async component, as Vue 3 no longer takes a plain function returning the import
const DocumentsTable = defineAsyncComponent(() => import('@/components/datatable/DocumentsTable'));

// stored under the component name, as before: existing preferences are kept
const preferences = getPreferences('DocumentsView');

export default {
  name: 'DocumentsView',

  components: {
    QueryItems,
    PageSelector,
    DocumentsTable,
    ImageCards,
    DisplayModeSwitch,
    LoadUserPreferencesButton,
  },

  data() {
    return {
      promise: {},

      displayMode: 'both',
      listMode: null,

      isMobile: null,

      highlightedDocument: null,

      filteredWaypoints: [],

      queryHasTags: false,

      // transport search context: search of the url (address/date/window) + its isochrones + batch verify results
      transportContext: null,
      transportSearchKey: null,
      batchVerifying: false,
      batchProgress: 0,
      batchTotal: 0,
      batchError: null,
    };
  },

  computed: {
    hasTransportContext() {
      return ['route', 'waypoint'].includes(this.documentType) && hasTransportQuery(this.$route.query);
    },
    /**
     * The documents of the page which schedules are not checked yet. Results are kept while the search is the same. The
     * routes of unknown duration are never checked: the accessibility of a route cannot be verified without its
     * duration.
     */
    documentsToVerify() {
      const results = this.transportContext?.results ?? {};

      return (this.documents?.documents ?? [])
        .filter((document) => !results[document.document_id] && !isDurationUnknown(document))
        .slice(0, MAX_ROUTE_THRESHOLD);
    },
    /** Number of documents of the page whose duration is unknown (the API lists them after the others) */
    durationUnknownCount() {
      return (this.documents?.documents ?? []).filter((document) => isDurationUnknown(document)).length;
    },
    firstDurationUnknownIndex() {
      return (this.documents?.documents ?? []).findIndex((document) => isDurationUnknown(document));
    },
    durationUnknownNotice() {
      return this.$gettext(
        'Routes whose duration is unknown: they may be reachable, but their accessibility cannot be verified'
      );
    },
    canVerifyBatch() {
      return this.hasTransportContext && !!this.transportContext && this.documentsToVerify.length > 0;
    },
    showMap() {
      return ['both', 'map'].includes(this.displayMode);
    },
    showResults() {
      return ['result', 'both'].includes(this.displayMode);
    },
    documents() {
      return this.promise.data;
    },
    documentType() {
      return this.$route.name.slice(0, -1);
    },
    documentTypes() {
      return ['route', 'waypoint', 'outing', 'image', 'book', 'area'];
    },
    documentAreGeoLocalized() {
      return constants.objectDefinitions[this.documentType].geoLocalized === true;
    },
    addQuery() {
      return {
        act: this.$route.query.act,
      };
    },
    queryWithoutOffsetAndSort() {
      const result = Object.assign({}, this.$route.query);
      delete result.offset;
      delete result.sort;

      return result;
    },
    documentsShownOnMap() {
      const base = this.filteredWaypoints.concat(this.documents ? this.documents.documents : []);
      if (!this.transportContext) {
        return base;
      }
      return base.concat(buildIsochroneOverlayDocuments(this.transportContext));
    },
  },

  watch: {
    $route: {
      handler: 'load',
      immediate: true,
    },
    displayMode: 'updateMapSize',
  },

  methods: {
    load() {
      this.displayMode = preferences.get(
        this.documentType + '.displayMode',
        this.documentAreGeoLocalized ? 'both' : 'result'
      );
      this.listMode = preferences.get(this.documentType + '.listMode', false);

      if (this.$route.hash) {
        // keep compatible with v6 AngularJs hacks...
        this.$router.replace(this.$route.fullPath.replace('#', '?'));
        // $route watcher will call load
        return;
      }

      this.promise = c2c[this.documentType].getAll(this.$route.query).then(() => {
        // the list has its height: back from a document, the router can restore the scroll position
        bus.emit('trigger-scroll');
      });

      this.loadTransportContext();
    },

    /**
     * Reads the transport search of the url (see `transport-query`), with its isochrones for the map. They are asked to
     * the API, which computes them once per search: the other filters change the url, not the search.
     */
    loadTransportContext() {
      const search = this.hasTransportContext ? parseTransportQuery(this.$route.query) : null;
      const key = search ? transportSearchKey(search) : null;

      if (key === this.transportSearchKey) {
        return;
      }

      this.transportSearchKey = key;

      if (!search) {
        this.transportContext = null;
        return;
      }

      this.transportContext = {
        fromAddress: search.from,
        date: search.date,
        returnDate: search.returnDate,
        minDeparture: search.minDeparture,
        maxReturn: search.maxReturn,
        hikingDuration: search.hikingDuration,
        allerGeom: null,
        retourGeom: null,
        intersectionGeom: null,
        results: null,
      };

      itinevertService
        .getTransportIsochrones(search)
        .then(({ data }) => {
          // the search may have changed meanwhile
          if (this.transportSearchKey === key) {
            this.transportContext = {
              ...this.transportContext,
              allerGeom: data.aller_geom || null,
              retourGeom: data.retour_geom || null,
              intersectionGeom: data.intersection_geom || null,
            };
          }
        })
        .catch((error) => {
          // the isochrones are only shown on the map
          console.warn('Error while loading the transport isochrones:', error);
        });
    },

    /**
     * Starts the batch round-trip verification job for the documents of the current page which are not checked yet,
     * then monitors its progress and adds the per-document results to the ones already known. The page is the unit: the
     * wait is short and the user sees the results of what is on screen, then checks the next page if wanted.
     */
    async verifyBatchAccessibility() {
      if (!this.canVerifyBatch || this.batchVerifying) {
        return;
      }

      this.batchVerifying = true;
      this.batchProgress = 0;
      this.batchTotal = 0;
      this.batchError = null;

      try {
        const ids = this.documentsToVerify.map((document) => document.document_id);

        await itinevertService.startRoundTripJob(
          ids,
          this.documentType,
          this.transportContext.date,
          this.transportContext.minDeparture,
          this.transportContext.maxReturn,
          this.transportContext.fromAddress,
          this.transportContext.hikingDuration || undefined,
          this.transportContext.returnDate
        );

        const family = this.documentType === 'waypoint' ? 'journeyroundtripwaypoints' : 'journeyroundtriproutes';

        itinevertService.monitorProgress(
          (raw) => {
            const progress = JSON.parse(raw);
            this.batchProgress = progress.progress;
            this.batchTotal = progress.total;
          },
          async () => {
            const response = await itinevertService.getRoundTripJobResult(this.documentType);
            const results = response.data?.result?.results ?? {};
            this.transportContext = {
              ...this.transportContext,
              results: { ...this.transportContext.results, ...results },
            };
            this.batchVerifying = false;
          },
          (raw) => {
            this.batchError = navitiaService.handleQueryError(raw);
            this.batchVerifying = false;
          },
          family
        );
      } catch (error) {
        this.batchError = { message: error.message };
        this.batchVerifying = false;
      }
    },

    toogleProperty(property) {
      this.setProperty(property, !this[property]);
    },

    setProperty(property, value) {
      this[property] = value;
      preferences.set(`${this.documentType}.${property}`, this[property]);
    },

    getDocumentTypeTitle(documentType) {
      return this.$gettext(documentType + 's');
    },

    // when map container is resized (which happen when displayMode switchs between both and map),
    // openLayer need an explicit resize
    updateMapSize(newValue, oldValue) {
      if ((newValue === 'map' && oldValue === 'both') || (newValue === 'both' && oldValue === 'map')) {
        this.$nextTick(this.$refs.map.map.updateSize.bind(this.$refs.map.map));
      }
    },

    onQueryDocumentsLoad(documents) {
      this.queryHasTags = documents.length > 0;
      this.filteredWaypoints = documents.filter((document) => document.type === 'w');

      // do not display waypoints associated
      this.filteredWaypoints.forEach((document) => delete document.associations);
    },
  },
};
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

.duration-unknown-heading {
  font-weight: bold;
  color: #555;
  padding: 0.5rem 0.75rem;
}

.verify-accessibility-batch {
  position: relative;
  display: inline-block;

  .tooltip {
    position: absolute;
    opacity: 0;
    transition: 0.2s;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 5px 10px;
    border-radius: 4px;
    white-space: normal;
    width: 220px;
    text-align: center;
    pointer-events: none;
    z-index: 30;
  }

  &:hover .tooltip {
    opacity: 1;
  }

  .batch-error {
    display: block;
    color: #c62828;
    font-size: 0.75rem;
    white-space: nowrap;
  }
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
        100vh - #{$navbar-height} - 3 * #{$mobile-section-padding} - #{$mobile-header-height} - #{$mobile-filters-height}
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
