<template>
  <div class="section documents-view">
    <html-header :title="$gettext(documentType) + 's'"/>
    <div class="level is-mobile header-section">
      <div class="level-left">
        <span class="level-item">
          <div class="dropdown is-hoverable">
            <div class="dropdown-trigger">
              <span class="title is-1">
                {{ getDocumentTypeTitle(documentType) | uppercaseFirstLetter }}
              </span>
              <fa-icon icon="angle-down" aria-hidden="true"/>
            </div>
            <div class="dropdown-menu" role="menu">
              <div class="dropdown-content">
                <div v-for="type of documentTypes" :key="type" class="dropdown-item is-size-6 has-hover-background">
                  <router-link
                    :to="{name: type + 's', query:$route.query}"
                    class="has-text-normal"
                    :class="{'has-text-primary has-text-weight-bold': type === documentType}">
                    <icon-document :document-type="type" />
                    <span>&nbsp;{{ getDocumentTypeTitle(type) | uppercaseFirstLetter }}</span>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </span>

        <span v-if="!['area', 'profile', 'image'].includes(documentType)" class="level-item">
          <add-link
            :document-type="documentType"
            :query="addQuery"
            class="is-size-3"
            :title="$gettext('Create')">
            <fa-icon icon="plus-circle" />
          </add-link>
        </span>
      </div>

      <div class="level-right" v-if="documentType!='profile'">
        <div class="level-item is-size-3 is-hidden-mobile">
          <fa-icon
            v-show="displayMode!=='map'"
            icon="th-list"
            class="has-cursor-pointer"
            :class="listMode ? 'has-text-primary' : ''"
            :title="$gettext('List mode')"
            @click="toogleProperty('listMode')" />
          &nbsp;
          <fa-icon
            v-show="displayMode!=='map'"
            icon="th"
            class="has-cursor-pointer"
            :class="!listMode ? 'has-text-primary' : ''"
            :title="$gettext('Cards mode')"
            @click="toogleProperty('listMode')" />
          &nbsp;
          &nbsp;
          <div v-if="documentAreGeoLocalized" class="dropdown is-hoverable is-right display-mode-switcher">
            <div class="dropdown-trigger">
              <fa-icon
                :icon="['fas', 'eye']"
                class="has-cursor-pointer"/>
            </div>
            <div class="dropdown-menu" role="menu">
              <div class="dropdown-content">
                <table class="dropdown-item is-size-6">
                  <tr
                    class="has-hover-background has-cursor-pointer"
                    :class="{'has-text-primary has-text-weight-bold': displayMode==='result'}"
                    @click="setProperty('displayMode', 'result')">
                    <td class="has-text-centered">
                      <fa-icon :icon="listMode ? 'th-list' : 'th'"/>
                    </td>
                    <td class="is-nowrap" v-translate>Results only</td>
                  </tr>
                  <tr
                    class="has-hover-background has-cursor-pointer"
                    :class="{'has-text-primary has-text-weight-bold': displayMode==='both'}"
                    @click="setProperty('displayMode', 'both')">
                    <td class="is-nowrap">
                      <fa-icon :icon="listMode ? 'th-list' : 'th'"/>
                      <span>&thinsp;</span>
                      <fa-icon icon="map-marked-alt"/>
                    </td>
                    <td class="is-nowrap" v-translate>Both results and map</td>
                  </tr>
                  <tr
                    class="has-hover-background has-cursor-pointer"
                    :class="{'has-text-primary has-text-weight-bold': displayMode==='map'}"
                    @click="setProperty('displayMode', 'map')">
                    <td class="has-text-centered">
                      <fa-icon icon="map-marked-alt"/>
                    </td>
                    <td class="is-nowrap" v-translate>Map only</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="level-item is-size-3 is-hidden-tablet">
          <fa-icon
            icon="map-marked-alt"
            :class="{'has-text-primary': displayMode === 'map'}"
            @click="setProperty('displayMode', 'map')"/>
          <span>&thinsp;</span>
          <fa-icon
            icon="th"
            :class="{'has-text-primary': displayMode !== 'map'}"
            @click="setProperty('displayMode', 'both')"/>
        </div>
      </div>
    </div>

    <query-items class="filter-section"/>

    <div class="columns result-section" :class="'mobile-mode-' + displayMode">
      <div v-if="showResults" class="column documents-container" :class="{'is-12': !showMap, 'is-8': showMap}">

        <loading-notification :promise="promise"/>

        <image-cards v-if="documents && !listMode && documentType === 'image'" :documents="documents"/>

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
            <document-card :highlighted="highlightedDocument===document" :document="document"/>
          </div>
        </div>

        <documents-table
          v-if="listMode"
          :documents="documents ? documents : {}"
          :document-type="documentType"
          class="documents-table"/>
      </div>
      <div v-if="showMap" class="column map-container">
        <map-view
          ref="map"
          :documents="documents ? documents.documents : []"
          :highlighted-document="highlightedDocument"
          @highlightDocument="highlightedDocument = arguments[0]"
          show-filter-control
          show-center-on-geolocation
          show-recenter-on/>
      </div>
    </div>

    <page-selector :documents="documents"/>
  </div>
</template>

<script>

  import c2c from '@/js/apis/c2c';
  import constants from '@/js/constants';

  import QueryItems from './utils/QueryItems';
  import PageSelector from './utils/PageSelector';
  import ImageCards from './utils/ImageCards';

  const DocumentsTable = () => import(/* webpackChunkName: "data-table" */ '@/components/datatable/DocumentsTable');

  export default {
    name: 'DocumentsView',

    components: {
      QueryItems,
      PageSelector,
      DocumentsTable,
      ImageCards
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
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  $section-padding: 1.5rem; //TODO find this variable
  $header-height : 34px;
  $header-margin-bottom : 1rem; //TODO find this variable
  $filter-height : 32px;
  $filter-padding-bottom : 1.5rem;
  $page-selector-height : 3rem;
  $result-height : calc(100vh - #{$navbar-height} - 2*#{$section-padding} - #{$header-height} - #{$header-margin-bottom} - #{$filter-padding-bottom} - #{$filter-height} - #{$page-selector-height}); //  - #{$bulma-section-padding}*2 - #{$header-height} - #{$filter-height} - #{$filter-padding}*2);
  $cards-gap:0.25rem;

  .filter-section{
    padding-bottom: $filter-padding-bottom;
  }

  @media screen and (max-width: $tablet) {

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

    .display-mode-switcher{
      td:nth-child(2){
        padding-left:0.5rem;
      }
    }
  }

</style>
