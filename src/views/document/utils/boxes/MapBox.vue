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
      <div class="map-container" :class="{ elevationProfileHidden }">
        <map-view
          :documents="new Array(document)"
          :show-protection-areas="['r', 'w'].includes(document.type)"
          :biodiv-sports-activities="document.activities"
          :full-screen-element-id="
            !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
          "
          @has-protection-area="$emit('has-protection-area')"
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
  },

  methods: {
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

      const filename = this.document.document_id + extension;
      const content = format.writeFeatures([feature], {
        featureProjection: 'EPSG:3857',
      });

      utils.download(content, filename, mimetype + ';charset=utf-8');
    },
  },
};
</script>

<style lang="scss" scoped>
.map-container {
  height: 275px;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

/**
 * Fullscreen mode *with* elevation profile
 * Without the elevation profile it's the map-view
 * element that goes into fullscreen mode, so the
 * rule doesn't apply
 */
:fullscreen .map-container {
  height: 70%;
  max-height: calc(100% - 200px);
  min-height: calc(100% - 350px);
  margin: 0;

  &.elevationProfileHidden {
    height: 100%;
    max-height: 100%;
  }
}
</style>
