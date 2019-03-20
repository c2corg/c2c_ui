<template>
  <div class="section documents-view">
    <html-header :title="$gettext(documentType) + 's'" />
    <div class="header-section">

      <dropdown-button class="header-item">
        <span slot="button">
          <span class="title is-1">
            {{ getDocumentTypeTitle(documentType) | uppercaseFirstLetter }}
          </span>
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>
        <router-link
          v-for="type of documentTypes"
          :key="type"
          class="dropdown-item is-size-6"
          :class="{'is-active': type === documentType}"
          :to="{name: type + 's', query:queryWithoutOffset}">
          <icon-document :document-type="type" />
          <span>&nbsp;{{ getDocumentTypeTitle(type) | uppercaseFirstLetter }}</span>
        </router-link>
      </dropdown-button>

      <add-link
        v-if="!['area', 'profile', 'image'].includes(documentType)"
        :document-type="documentType"
        :query="addQuery"
        class="is-size-3 header-item"
        :title="$gettext('Create')">
        <fa-icon icon="plus-circle" />
      </add-link>

      <span class="is-pulled-right is-flex header-right" v-if="documentType!='profile'">
        <button v-if="$user.isLogged" class="button is-small is-primary header-item" @click="loadPreferences">
          <fa-icon icon="star" />
          <span class="is-hidden-mobile">&nbsp;</span>
          <span class="is-hidden-mobile" v-translate>
            Load my preferences
          </span>
        </button>

        <span
          @click="toogleProperty('listMode')"
          class="header-item is-size-3 has-cursor-pointer is-hidden-mobile">
          <fa-icon
            v-show="displayMode!=='map'"
            icon="th-list"
            :class="listMode ? 'has-text-primary' : ''"
            :title="$gettext('List mode')" />
          <span>&thinsp;</span>
          <fa-icon
            v-show="displayMode!=='map'"
            icon="th"
            :class="!listMode ? 'has-text-primary' : ''"
            :title="$gettext('Cards mode')" />
        </span>
        <display-mode-switch
          v-if="documentAreGeoLocalized"
          class="header-item is-hidden-mobile"
          list-mode="listMode"
          :value="displayMode"
          @input="setProperty('displayMode', arguments[0])" />

        <span class="header-item is-size-3 is-hidden-tablet">
          <fa-icon
            icon="map-marked-alt"
            :class="{'has-text-primary': displayMode === 'map'}"
            @click="setProperty('displayMode', 'map')" />
          <span>&thinsp;</span>
          <fa-icon
            icon="th"
            :class="{'has-text-primary': displayMode !== 'map'}"
            @click="setProperty('displayMode', 'both')" />
        </span>
      </span>

    </div>

    <query-items class="filter-section" />

    <div class="columns result-section" :class="'mobile-mode-' + displayMode">
      <div v-if="showResults" class="column documents-container" :class="{'is-12': !showMap, 'is-8': showMap}">

        <loading-notification :promise="promise" />

        <image-cards v-if="documents && !listMode && documentType === 'image'" :documents="documents" />

        <div v-if="documents && !listMode && documentType !== 'image'" class="columns is-multiline is-variable is-1 cards-list">
          <div
            v-for="(document, index) in documents.documents"
            :key="index"
            :class="{
              'is-full-mobile is-half-tablet is-half-desktop is-half-widescreen is-one-third-fullhd':showMap,
              'is-full-mobile is-one-third-tablet is-one-third-desktop is-one-quarter-widescreen is-one-quarter-fullhd':!showMap,
            }"
            class="column card-container"
            @mouseenter="highlightedDocument = document"
            @mouseleave="highlightedDocument = null">
            <document-card :highlighted="highlightedDocument===document" :document="document" />
          </div>
        </div>

        <documents-table
          v-if="listMode"
          :documents="documents ? documents : {}"
          :document-type="documentType"
          class="documents-table" />
      </div>
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="map"
          :documents="documents ? documents.documents : []"
          :highlighted-document="highlightedDocument"
          @highlightDocument="highlightedDocument = arguments[0]"
          show-filter-control
          show-center-on-geolocation
          show-recenter-on />
      </div>
    </div>

    <page-selector :documents="documents" />
  </div>
</template>

<script>

  import c2c from '@/js/apis/c2c';
  import constants from '@/js/constants';

  import QueryItems from './utils/QueryItems';
  import PageSelector from './utils/PageSelector';
  import ImageCards from './utils/ImageCards';
  import DisplayModeSwitch from './utils/DisplayModeSwitch';

  const DocumentsTable = () => import(/* webpackChunkName: "data-table" */ '@/components/datatable/DocumentsTable');

  export default {
    name: 'DocumentsView',

    components: {
      QueryItems,
      PageSelector,
      DocumentsTable,
      ImageCards,
      DisplayModeSwitch
    },

    data() {
      return {
        promise: null,

        displayMode: 'both',
        listMode: null,

        isMobile: null,

        highlightedDocument: null
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
          act: this.$route.query.act
        };
      },
      queryWithoutOffset() {
        const result = Object.assign({}, this.$route.query);
        delete result.offset;

        return result;
      }
    },

    watch: {
      '$route': {
        handler: 'load',
        immediate: true
      },
      'displayMode': 'updateMapSize'
    },

    methods: {

      load() {
        this.displayMode = this.$localStorage.get(this.documentType + '.displayMode', this.documentAreGeoLocalized ? 'both' : 'result');
        this.listMode = this.$localStorage.get(this.documentType + '.listMode', false);
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

      loadPreferences() {
        c2c.userProfile.preferences.get().then((result) => {
          const preferences = result.data;
          const query = Object.assign({}, this.$route.query);

          if (['outing', 'route', 'image', 'xreport', 'books', 'articles'].includes(this.documentType)) {
            const activities = preferences.activities.join(',');
            query.act = activities === '' ? undefined : activities;
          }

          if (['outing', 'route', 'image', 'xreport', 'waypoint'].includes(this.documentType)) {
            const areas = preferences.areas.map((area) => area.document_id).join(',');
            query.a = areas === '' ? undefined : areas;
            query.bbox = undefined;
          }

          this.$router.push({ query });
        });
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  $section-padding: 1.5rem; //TODO find this variable
  $header-height : 34px;
  $header-margin-bottom : 1.5rem; //TODO find this variable
  $filter-height : 32px;
  $filter-padding-bottom : 1.5rem;
  $page-selector-height : 3rem;
  $result-height : calc(100vh - #{$navbar-height} - 2*#{$section-padding} - #{$header-height} - #{$header-margin-bottom} - #{$filter-padding-bottom} - #{$filter-height} - #{$page-selector-height}); //  - #{$bulma-section-padding}*2 - #{$header-height} - #{$filter-height} - #{$filter-padding}*2);
  $cards-gap:0.25rem;

  .header-section{
    margin-bottom: $header-margin-bottom;
  }

  .header-right{
    align-items: center;
  }

  .header-item:not(:first-child) {
    margin-bottom: 0;
    margin-left: .75rem;
  }

  .filter-section{
    padding-bottom: $filter-padding-bottom;
    clear:both;
  }

  @media screen and (max-width: $tablet) {

    .documents-view{
      padding-left: 0;
      padding-right: 0;
    }

    .filter-section, .header-section{
      padding-left:0.5rem;
      padding-right:0.5rem;
    }

    .map-container{
      height: $result-height;
      padding-left:0;
      padding-top:0;
      padding-bottom:0;
    }

    .mobile-mode-map{
      margin-top:0;
      height:$result-height;

      .documents-container{
        display:None;
      }
    }

    .mobile-mode-result, .mobile-mode-both{
      .map-container{
        visibility: hidden; // map does not like to be in a display none...
        height: 0;
      }
    }
  }

  @media screen and (min-width: $tablet){
    .result-section{
      margin-top:0;
      height:$result-height;

      .documents-container{
        height:100%;
        overflow: auto;

        .cards-list{
          padding-top:2px;
          height:100%;
        }

        .documents-table{
          height:100%;
        }

      //    transition:0.3s;
      }

      .map-container{
        min-height: 100%;
        padding-left:0;
        padding-top:0;
        padding-bottom:0;
      //    transition:0.3s;
      }
    }
  }

</style>
