<template>
  <div>
    <div class="columns is-mobile" v-if="geomDetailEditable">
      <div class="column is-narrow">
        <div v-if="hasTrackingActivities">
          <button class="button is-primary is-small" @click="openGPSModal" v-translate>Upload a GPS track</button>
          <gps-upload-modal ref="GpsUploadModal" @data="setGeometry"></gps-upload-modal>
        </div>
        <gps-file-upload class="upload-button" @click="setGeometry" v-else>
          <span v-translate>Upload a GPS track</span>
        </gps-file-upload>
      </div>
      <div class="column">
        <em v-translate>You may also drag, draw or edit the track on the map.</em>
      </div>
    </div>

    <div class="columns is-multiline">
      <div class="column is-12 map-container">
        <map-view
          ref="map"
          :initial-extent="initialExtent"
          :documents="documents"
          :edited-document="document"
          :geom-detail-editable="geomDetailEditable"
          show-center-on-geolocation
          show-recenter-on
          @move="$emit('move', arguments[0])"
        />
      </div>
      <div class="column is-6">
        <div class="field">
          <label class="label">{{ $gettext('Longitude') }}</label>
          <input-simple type="number" postfix="°E" v-model="longitude" @input="setGeometryPoint" />
        </div>
      </div>
      <div class="column is-6">
        <div class="field">
          <label class="label">{{ $gettext('Latitude') }}</label>
          <input-simple type="number" postfix="°N" v-model="latitude" @input="setGeometryPoint" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GpsFileUpload from '@/components/map/GpsFileUpload';
import GpsUploadModal from '@/components/map/GpsUploadModal';
import trackingService from '@/js/apis/tracking-service';
import ol from '@/js/libs/ol';
import { requireDocumentProperty } from '@/js/properties-mixins';

const geoJSONFormat = new ol.format.GeoJSON();
const FORM_PROJ = 'EPSG:4326';
const DATA_PROJ = 'EPSG:3857';

export default {
  components: { GpsUploadModal, GpsFileUpload },

  mixins: [requireDocumentProperty],

  props: {
    geomDetailEditable: {
      type: Boolean,
      default: false,
    },
    documents: {
      type: Array,
      default: null,
    },
    initialExtent: {
      type: Array,
      default: null,
    },
  },

  data() {
    return {
      latitude: null,
      longitude: null,
      hasTrackingActivities: false,
    };
  },

  computed: {
    hasError() {
      return false;
    },
    visible() {
      return true;
    },
  },

  watch: {
    'document.geometry.geom': {
      handler: 'setLatitudeLongitude',
      immediate: true,
    },
  },

  mounted() {
    trackingService.getStatus(this.$user.id).then(
      ({ data }) => {
        if (Object.values(data).includes('configured')) {
          this.hasTrackingActivities = true;
        }
      },
      () => {
        // do nothing if errored
      }
    );
  },

  methods: {
    openGPSModal() {
      this.$refs.GpsUploadModal.show();
    },

    setGeometry(geometry) {
      this.$refs.map.setDocumentGeometryFromGeoFile(geometry);
    },

    setGeometryPoint() {
      if (this.latitude === null || this.longitude === null) {
        return;
      }

      const longitude = parseFloat(String(this.longitude).replace(',', '.'));
      const latitude = parseFloat(String(this.latitude).replace(',', '.'));

      const point = new ol.geom.Point([longitude, latitude]);
      point.transform(FORM_PROJ, DATA_PROJ);
      this.document.geometry.geom = geoJSONFormat.writeGeometry(point);
    },

    setLatitudeLongitude() {
      if (!this.document || !this.document.geometry || !this.document.geometry.geom) {
        return {};
      }

      const point = geoJSONFormat.readGeometry(this.document.geometry.geom);

      point.transform(DATA_PROJ, FORM_PROJ);

      const coords = point.getCoordinates();

      this.longitude = Math.round(coords[0] * 1000000) / 1000000;
      this.latitude = Math.round(coords[1] * 1000000) / 1000000;
    },

    fitMapToDocuments() {
      return this.$refs.map.fitMapToDocuments(true);
    },
  },
};
</script>

<style scoped lang="scss">
.upload-button {
  position: relative;
}

.map-container {
  height: 400px;
}
</style>
