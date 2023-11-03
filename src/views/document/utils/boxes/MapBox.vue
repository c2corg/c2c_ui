<template>
  <div class="box no-print">
    <div v-if="document.areas && document.areas.length" class="has-text-centered">
      <icon-area />
      <span>&nbsp;</span>
      <span v-for="area of document.areas" :key="area.document_id" class="area-link">
        <document-link :document="area" />&#0032;
      </span>
    </div>

    <!-- The fullscreen map container is used to display both the map
         and the elevation profile in fullscreen (if the elevation profile exists) -->
    <div id="fullscreen-map-container">
      <div
        class="map-container"
        :class="{
          'with-elevation-profile': showElevationProfile && !elevationProfileHidden,
          pinned: pinnedMode,
          'pinned-to-top': pinnedSide === 'top',
          'pinned-to-left': pinnedSide === 'left',
          'fill-parent': !pinnedMode,
        }"
      >
        <map-view
          ref="mapView"
          :documents="new Array(document)"
          :show-protection-areas="['r', 'w'].includes(document.type)"
          :biodiv-sports-activities="document.activities"
          :full-screen-element-id="
            !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
          "
          :show-pin-to-top-button="true"
          @has-protection-area="$emit('has-protection-area')"
          @pin-to-top-clicked="togglePinToSide(true)"
        />
      </div>

      <elevation-profile :document="document" v-if="showElevationProfile" @has-data="elevationProfileHasData = true" />
    </div>

    <div class="buttons is-centered">
      <router-link v-if="showYetiButton" :to="yetiUrl" class="button is-small">
        <icon-yeti class="icon" />
        <span v-translate>YETI</span>
      </router-link>
      <button v-if="showDownloadTraceButtons" class="button is-primary is-small" @click="downloadGpx">GPX</button>
      <button v-if="showDownloadTraceButtons" class="button is-primary is-small" @click="downloadKml">KML</button>
      <button
        v-if="hasMapLinks"
        class="button is-small"
        @click="mapLinksAreVisible = !mapLinksAreVisible"
        :class="{ 'is-success': mapLinksAreVisible }"
      >
        <icon-map />
      </button>
    </div>
    <map-links v-if="mapLinksAreVisible" :document="document" />
  </div>
</template>

<script>
import ElevationProfile from './ElevationProfile';
import MapLinks from './MapLinks';

import ol from '@/js/libs/ol';
import { requireDocumentProperty } from '@/js/properties-mixins';
import utils from '@/js/utils';

const GeoJSON = new ol.format.GeoJSON();

export default {
  components: {
    ElevationProfile,
    MapLinks,
  },

  mixins: [requireDocumentProperty],

  data() {
    return {
      mapLinksAreVisible: false,
      elevationProfileHasData: false,
      elevationProfileHidden: false,
      pinnedMode: 0,
      pinnedSide: '',
    };
  },

  computed: {
    showElevationProfile() {
      return this.documentType === 'outing';
    },

    showYetiButton() {
      // at least one of document activities is concerned by yeti

      if (!this.document || this.documentType !== 'route' || !this.document.activities) {
        return false;
      }

      const activities = ['skitouring', 'snow_ice_mixed', 'ice_climbing', 'snowshoeing'];

      return this.document.activities.some((activity) => activities.includes(activity));
    },

    showDownloadTraceButtons() {
      return this.document.geometry && (this.document.geometry.geom_detail || this.documentType === 'waypoint');
    },

    hasMapLinks() {
      return (this.document.maps && this.document.maps.length !== 0) || this.document.maps_info;
    },

    yetiUrl() {
      return { name: 'yeti', params: { document_id: this.document.document_id } };
    },
  },

  mounted() {
    this.$root.$on('elevation_profile', (event, hide) => {
      if (event !== 'toggle_fullscreen') {
        return;
      }

      this.elevationProfileHidden = hide;
    });
    window.addEventListener('resize', this.resizePin);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.resizePin);
    if (this.pinnedMode) this.togglePinToSide(true);
    if (this.pinnedMode) this.togglePinToSide(true);
  },

  methods: {
    togglePinToSide(toggle) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakMobile = 769;
      // disable eg pin-to-left on mobile
      const maxMode = width < breakMobile || height < breakMobile ? 2 : 3;

      const toggleAmount = toggle ? 1 : 0;
      // 0: unpinned / 1: pinned side1 / 2: pinned side2
      this.pinnedMode = (this.pinnedMode + toggleAmount) % maxMode;

      // side1 is the preferred side for comfort, ie the larger dimension
      const [side1, side2] = width < height * 1.5 ? ['top', 'left'] : ['left', 'top'];
      this.pinnedSide = this.pinnedMode === 0 ? '' : this.pinnedMode === 1 ? side1 : side2;

      if (this.pinnedSide === 'left') {
        document.body.style.paddingLeft = '30%';
        document.body.style.paddingTop = null;
      } else if (this.pinnedSide === 'top') {
        document.body.style.paddingLeft = null;
        document.body.style.paddingTop = '45vh'; // as % is relative to width
      } else {
        document.body.style.paddingLeft = null;
        document.body.style.paddingTop = null;
      }
      setTimeout(() => {
        // deferred so that map.getSize() gets updated
        if (this.$refs.mapView) {
          this.$refs.mapView.fitMapToDocuments();
        }
      });
    },

    resizePin() {
      this.togglePinToSide(false);
    },

    hasDataChanged(value) {
      this.elevationProfileHasData = value;
    },

    downloadKml() {
      this.downloadFeatures(new ol.format.KML(), '.kml', 'application/vnd.google-earth.kml+xml');
    },

    downloadGpx() {
      this.downloadFeatures(new ol.format.GPX(), '.gpx', 'application/gpx+xml');
    },

    downloadFeatures(format, extension, mimetype) {
      let features = [];
      if (this.document.geometry.geom_detail) {
        features = GeoJSON.readFeatures(this.document.geometry.geom_detail);
      } else if (this.document.geometry.geom) {
        features = GeoJSON.readFeatures(this.document.geometry.geom);
      }
      if (!features.length) {
        return;
      }

      // Export only the current document geometry, not the associated features
      const feature = features[0];
      const name = this.$documentUtils.getDocumentTitle(this.document, this.$route.params.lang);

      feature.set('name', name);

      const filename = this.getDownloadedFileName(name, extension);
      const content = format.writeFeatures([feature], {
        featureProjection: 'EPSG:3857',
      });

      utils.download(content, filename, mimetype + ';charset=utf-8');
    },

    getDownloadedFileName(name, extension) {
      let filename = this.document.document_id + '_' + name.substring(0, 100);
      if (this.documentType === 'outing') {
        filename = filename + '_' + this.document.date_start;
      }
      // Remove forbidden characters/spaces, and replace them with '_'
      return filename.replace(/[/\\?%*:|"<>]/g, ' ').replace(/\s+/g, '_') + extension;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '~bulma/sass/utilities/mixins.sass';

.map-container {
  margin-top: 1rem;
  margin-bottom: 1rem;
  background: beige;

  &.fill-parent {
    height: 275px;
  }
  &.pinned {
    position: fixed;
    top: $navbar-height;
    margin-top: 0; /*avoid space between nav and map, where body text can be seen while scrolling*/
    z-index: 10; /* on top of body but below navbar (z=25) and side-menu (z=30) */
    box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.4); // <o-x> <o-y> <radius>
  }
  &.pinned-to-top {
    right: 0px;
    height: 45vh;
    width: 100%;
    @include desktop {
      left: $sidemenu-width + 2px; /* when is sidemenu shown, as in App.vue */
    }
  }
  &.pinned-to-left {
    left: 0px;
    height: calc(100vh - #{$navbar-height});
    width: 30vw;
  }
}
#app[data-width='desktop'] .map-container.pinned-to-left {
  left: $sidemenu-width;
}
#app:not([data-width='desktop']) .map-container.pinned-to-left {
  left: 0;
}

/**
 * Fullscreen mode *with* elevation profile
 * Without the elevation profile it's the map-view
 * element that goes into fullscreen mode, so the
 * rule doesn't apply
 */
:fullscreen .map-container {
  height: 100%;
  max-height: 100%;
  margin: 0;

  &.with-elevation-profile {
    height: 70%;
    max-height: calc(100% - 200px);
    min-height: calc(100% - 350px);
  }
}
</style>
