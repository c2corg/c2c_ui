<template>
  <div class="box no-print">

    <div v-if="document.areas && document.areas.length" class="has-text-centered">

      <icon-area />
      <span>&nbsp;</span>
      <span v-for="area of document.areas" :key="area.document_id" class="area-link">
        <document-link :document="area" />&#0032;
      </span>

    </div>

    <div class="map-container">
      <map-view
        :documents="new Array(document)"
        :show-protection-areas="['r', 'w'].includes(document.type)"
        :biodiv-sports-activities="document.activities"
        @has-protection-area="$emit('has-protection-area')" />
    </div>

    <elevation-profile :document="document" v-if="documentType=='outing'" />

    <div class="columns is-multiline is-mobile is-clearfix">
      <div class="column is-full-tablet is-full-desktop is-half-widescreen ">
        <router-link v-if="showYetiButton" :to="yetiUrl" class="button is-small">
          <icon-yeti class="icon" />
          <span>Voir dans YETI</span>
        </router-link>
      </div>
      <div class="column">
        <div
          v-if="document.geometry && (document.geometry.geom_detail || documentType == 'waypoint')"
          class="buttons is-pulled-right">
          <button class="button is-primary is-small" @click="downloadGpx">
            GPX
          </button>
          <button class="button is-primary is-small" @click="downloadKml">
            KML
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import utils from '@/js/utils';
  import ol from '@/js/libs/ol';

  import { requireDocumentProperty } from '@/js/properties-mixins';
  import ElevationProfile from './ElevationProfile';

  const GeoJSON = new ol.format.GeoJSON();

  export default {
    components: {
      ElevationProfile
    },

    mixins: [ requireDocumentProperty ],

    computed: {
      showYetiButton() {
        // at least one of document activities is concerned by yeti

        if (!this.document || !this.document.activities) {
          return false;
        }

        const activities = ['skitouring', 'snow_ice_mixed', 'ice_climbing', 'snowshoeing'];

        return this.document.activities.some(activity => activities.includes(activity));
      },

      yetiUrl() {
        return { name: 'yeti', params: { 'document_id': this.document.document_id } };
      }
    },

    methods: {
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
          featureProjection: 'EPSG:3857'
        });

        utils.download(content, filename, mimetype + ';charset=utf-8');
      }
    }
  };
</script>

<style scoped>
  .map-container{
    height: 275px;
    margin-top:1rem;
    margin-bottom:1rem;
  }

  .nearby-link{
    margin-top:1rem;
    margin-bottom:1rem;
  }
</style>
