<template>
  <div class="section documents-view">
    <html-header :title="getDocumentTypeTitle(documentType)" />
    <div class="search-infos">
      <div class="header-section">
        <span>
          <dropdown-button class="header-item">
            <span slot="button">
              <span class="title is-3 is-ellipsed">
                {{ getDocumentTypeTitle(documentType) | uppercaseFirstLetter }}
              </span>
              <fa-icon icon="angle-down" aria-hidden="true" />
            </span>
            <router-link
              v-for="type of documentTypes"
              :key="type"
              class="dropdown-item is-size-6"
              :class="{ 'is-active': type === documentType }"
              :to="{ name: type + 's', query: queryWithoutOffsetAndSort }"
            >
              <icon-document :document-type="type" />
              <span>&nbsp;{{ getDocumentTypeTitle(type) | uppercaseFirstLetter }}</span>
            </router-link>
          </dropdown-button>
          &nbsp;
          <br class="is-hidden-tablet" />
          <page-selector :documents="documents" />
        </span>
        <span class="is-pulled-right is-flex header-right" v-if="documentType != 'profile'">
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
            @mouseleave="highlightedDocument = null"
          >
            <document-card :highlighted="highlightedDocument === document" :document="document" />
          </div>
        </div>

        <documents-table
          v-if="listMode"
          :documents="documents ? documents : {}"
          :document-type="documentType"
          :highlighted-document="highlightedDocument"
          @highlight-document="highlightedDocument = arguments[0]"
          class="documents-table"
        />
      </div>
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="map"
          :documents="documentsShownOnMap"
          :highlighted-document="highlightedDocument"
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
import DisplayModeSwitch from './utils/DisplayModeSwitch';
import ImageCards from './utils/ImageCards';
import LoadUserPreferencesButton from './utils/LoadUserPreferencesButton';
import PageSelector from './utils/PageSelector';
import QueryItems from './utils/QueryItems';

import { add_search_queries } from '@/js/add-search-query';
import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';

const DocumentsTable = () => import(/* webpackChunkName: "data-table" */ '@/components/datatable/DocumentsTable');

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
    };
  },

  computed: {
    showMap() {
      return ['both', 'map'].includes(this.displayMode);
    },
    showResults() {
      return ['result', 'both'].includes(this.displayMode);
    },
    documents() {
      let documents = this.promise.data;
      if (documents) {
        add_search_queries(this.$route.query, documents.documents);
      }
      return documents;
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
      return this.filteredWaypoints.concat(this.documents ? this.documents.documents : []);
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
      this.displayMode = this.$localStorage.get(
        this.documentType + '.displayMode',
        this.documentAreGeoLocalized ? 'both' : 'result'
      );
      this.listMode = this.$localStorage.get(this.documentType + '.listMode', false);

      if (this.$route.hash) {
        // keep compatible with v6 AngularJs hacks...
        this.$router.replace(this.$route.fullPath.replace('#', '?'));
        // $route watcher will call load
        return;
      }

      this.promise = c2c[this.documentType].getAll(this.$route.query);
    },

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
