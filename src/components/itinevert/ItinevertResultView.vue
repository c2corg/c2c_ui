<template>
  <div class="section documents-view">
    <html-header :title="getDocumentTypeTitle(documentType)" />
    <div class="search-infos">
      <div class="header-section">
        <span>
          <span class="title is-3 is-ellipsed">
            {{ getDocumentTypeTitle(documentType) | uppercaseFirstLetter }}
          </span>
          &nbsp;
          <br class="is-hidden-tablet" />
          <itinevert-page-selector
            :documents="filteredDocuments"
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
              :value="displayMode"
              @input="setProperty('displayMode', arguments[0])"
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
        :list-mode="listMode"
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
          :documents="filteredDocuments ? filteredDocuments : {}"
          :document-type="documentType"
          :highlighted-document="highlightedDocument"
          :open-in-new-tab="true"
          @highlight-document="highlightedDocument = arguments[0]"
          class="documents-table"
        />
      </div>
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="map"
          :documents="documentsShownOnMap"
          :highlighted-document="highlightedDocument"
          :open-in-new-tab="true"
          @highlight-document="highlightedDocument = arguments[0]"
          show-filter-control
          show-center-on-geolocation
          show-recenter-on
        />
      </div>
    </div>
  </div>
</template>

<script>
import DisplayModeSwitch from '../../views/documents/utils/DisplayModeSwitch';

import ItinevertPageSelector from './ItinevertPageSelector.vue';

import itinevertService, { POLYGON_STYLE } from '@/js/apis/itinevert-service';
import constants from '@/js/constants';
import QueryItems from '@/views/documents/utils/QueryItems.vue';

const DocumentsTable = () => import(/* webpackChunkName: "data-table" */ '@/components/datatable/DocumentsTable');

export default {
  name: 'ItinevertResultView',

  components: {
    QueryItems,
    ItinevertPageSelector,
    DocumentsTable,
    DisplayModeSwitch,
  },

  props: {
    fields: {
      type: Array,
      default: () => [],
    },
    baseQuery: {
      type: Object,
      default: null,
    },
    documents: {
      type: Object,
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
  },

  data() {
    return {
      displayMode: 'both',
      listMode: null,

      isMobile: null,

      highlightedDocument: null,

      filteredDocuments: null,

      filteredDocumentsBeforePagination: null,

      queryHasTags: false,

      offset: 0,

      limit: 30,

      lastQuery: {},

      promise: {},
    };
  },

  computed: {
    showMap() {
      return ['both', 'map'].includes(this.displayMode);
    },
    showResults() {
      return ['result', 'both'].includes(this.displayMode);
    },
    documentAreGeoLocalized() {
      return constants.objectDefinitions[this.documentType].geoLocalized === true;
    },
    documentsShownOnMap() {
      const mapDocuments = [];
      if (this.polygonGeometry !== null) {
        // create an area document based on polygon geometry
        const areaDocument = {
          document_id: -1, // synthetic ID to avoid conflicts with real documents
          type: 'a',
          geometry: {
            version: 1,
            geom: JSON.stringify(this.polygonGeometry),
            geom_detail: JSON.stringify(this.polygonGeometry),
          },
          properties: {
            ...POLYGON_STYLE,
            nonInteractive: true,
          },
        };
        mapDocuments.push(areaDocument);
      }
      if (this.filteredDocuments) {
        return this.filteredDocuments?.documents?.concat(mapDocuments);
      } else {
        return this.documents?.documents?.concat(mapDocuments);
      }
    },
  },

  watch: {
    displayMode: 'updateMapSize',
    '$route.query': {
      async handler(newQuery) {
        this.filterPostNavitiaDocuments(newQuery);
      },
    },
  },

  mounted() {
    // init filtered documents
    if (!this.documents) {
      this.filteredDocuments = { documents: [], total: 0 };
      this.filteredDocumentsBeforePagination = { documents: [], total: 0 };
      this.promise = { data: this.filteredDocuments, error: null, cancel: () => {} };
      return;
    }
    this.filteredDocumentsBeforePagination = {
      documents: this.documents.documents,
      total: this.documents.total,
    };
    this.filteredDocuments = {
      documents: this.documents.documents.slice(this.offset, this.offset + this.limit),
      total: this.documents.total,
    };
    this.promise = {
      data: this.filteredDocuments,
      error: null,
      cancel: () => {},
    };
  },
  methods: {
    toogleProperty(property) {
      this.setProperty(property, !this[property]);
    },

    setProperty(property, value) {
      this[property] = value;
      this.$localStorage.set(`${this.documentType}.${property}`, this[property]);
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
    async paginatePostNavitiaDocuments(pagination) {
      this.offset = pagination[0];
      this.limit = pagination[1];
      // whenever a filter is applied, check if offset is < then total
      if (this.offset > this.filteredDocuments.total) {
        this.offset = Math.max(this.filteredDocuments.total - this.limit, 0);
      }

      // apply pagination
      this.filteredDocuments = {
        documents: this.filteredDocumentsBeforePagination.documents.slice(this.offset, this.offset + this.limit),
        total: this.filteredDocuments.total,
      };
    },
    async filterPostNavitiaDocuments(newQuery) {
      let paginateDoc = () => {
        this.filteredDocuments.total = this.filteredDocuments.documents.length;

        this.filteredDocumentsBeforePagination = this.filteredDocuments;

        // whenever a filter is applied, check if offset is < then total
        if (this.offset > this.filteredDocuments.total) {
          this.offset = Math.max(this.filteredDocuments.total - this.limit, 0);
        }

        // apply pagination
        this.filteredDocuments = {
          documents: this.filteredDocuments.documents.slice(this.offset, this.offset + this.limit),
          total: this.filteredDocuments.total,
        };
      };

      let query = itinevertService.enhanceQuery(this.baseQuery, newQuery);
      if (this.isochroneBbox !== '' && !query.bbox) {
        query.bbox = this.isochroneBbox;
      }
      this.lastQuery = query;

      let needToQuery = false;
      // working with routes
      // the base query has activites choosen during form step
      // there is no need to query if no extra filters are set
      // extra filters being other filters (not act), or when you unselect a base activity
      // if you add more activites than base, we do not query still, since this will never show more documents than all post navitia documents
      if (this.baseQuery['act']) {
        if (Object.keys(newQuery).length === 1) {
          // no activities selected and no extra filters, so we display all documents
          needToQuery = false;
        } else if (Object.keys(newQuery).length > 2) {
          needToQuery = true;
        } else {
          let newQueryAct = newQuery['act']?.split(',') ?? [];
          let baseQueryAct = this.baseQuery['act']?.split(',') ?? [];

          // check if all new activites match base activities
          for (let index in baseQueryAct) {
            if (!newQueryAct.includes(baseQueryAct[index])) {
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
        this.filteredDocuments = {
          documents: this.documents.documents,
          total: this.documents.total,
        };
        paginateDoc();
        if (this.promise) {
          this.promise.cancel();
          this.promise.data = this.filteredDocuments;
        }
      } else {
        // Select API function based on document type
        const functionToFetch =
          this.documentType === 'route'
            ? itinevertService.getAllReachableRoutes
            : itinevertService.getAllReachableWaypoints;

        // get list of previous document IDs
        const oldIds = this.documents?.documents?.map((doc) => doc.document_id) ?? [];

        // reset filtered list
        this.filteredDocuments.documents = [];

        // cancel ongoing promise
        this.promise?.cancel?.();

        // remove undefined values
        query = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined));

        // launch new API request
        const p = functionToFetch.call(itinevertService, query);

        // activate loader
        this.promise = {
          data: null,
          error: null,
          cancel: p.cancel,
        };

        p.then((data) => {
          // fill loader data (hides loader)
          this.promise.data = data;

          // filter only matching old IDsw
          for (const item of data) {
            if (oldIds.includes(item.document_id)) {
              this.filteredDocuments.documents.push(item);
            }
          }

          paginateDoc();
        }).catch((err) => {
          this.promise.error = err;
        });
      }
    },
  },
};
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
