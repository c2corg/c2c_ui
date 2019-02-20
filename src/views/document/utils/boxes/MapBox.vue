<template>
  <div class="box">

    <div v-if="document.areas && document.areas.length" class="has-text-centered">

      <icon-area/>
      <span>&nbsp;</span>
      <span v-for="area of document.areas" :key="area.document_id" class="area-link">
        <document-link :document="area"/>&#0032;
      </span>

    </div>

    <map-view
      class="map-view"
      :documents="new Array(document)"
      :show-protection-areas="['r', 'w'].includes(document.type)"
      :biodiv-sports-activities="document.activities"
      style="height:275px"
      @has-protection-area="$emit('has-protection-area')"/>

    <elevation-profile :document="document" v-if="documentType=='outing'"/>

    <div v-if="document.geometry && document.geometry.geom_detail" class="buttons is-centered">
      <button class="button is-primary" @click="downloadGpx">
        GPX
      </button>
      <button class="button is-primary" @click="downloadKml">
        KML
      </button>
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

    methods: {
      downloadKml() {
        this.downloadFeatures(new ol.format.KML(), '.kml', 'application/vnd.google-earth.kml+xml');
      },

      downloadGpx() {
        this.downloadFeatures(new ol.format.GPX(), '.gpx', 'application/gpx+xml');
      },

      downloadFeatures(format, extension, mimetype) {
        const features = GeoJSON.readFeatures(this.document.geometry.geom_detail);

        if (features.length) {
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
    }
  };
</script>

<style scoped>
    .map-view, .nearby-link{
        margin-top:1rem;
        margin-bottom:1rem;
    }
</style>
