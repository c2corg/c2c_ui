<template>
  <div>
    <div class="columns is-mobile" v-if="geomDetailEditable">
      <div class="column is-narrow">
        <div class="control upload-button">
          <input
            ref="geoFileInput"
            type="file"
            @change="uploadGeoFile"
            accept=".gpx,.kml,.fit,application/gpx+xml,application/vnd.ant.fit,application/vnd.google-earth.kml+xml"
          />
          <button class="button is-primary is-small" @click="$refs.geoFileInput.click()" v-translate>
            Upload a GPS track
          </button>
        </div>
      </div>
      <div class="column">
        <em v-translate> You may also drag, draw or edit the track on the map. </em>
      </div>
    </div>

    <div class="columns is-multiline">
      <div class="column is-12 map-container">
        <map-view
          ref="map"
          :edited-document="document"
          :geom-detail-editable="geomDetailEditable"
          show-center-on-geolocation
          show-recenter-on
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
import ol from '@/js/libs/ol';
import { requireDocumentProperty } from '@/js/properties-mixins';

const geoJSONFormat = new ol.format.GeoJSON();
const FORM_PROJ = 'EPSG:4326';
const DATA_PROJ = 'EPSG:3857';

export default {
  mixins: [requireDocumentProperty],

  props: {
    geomDetailEditable: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      latitude: null,
      longitude: null,
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

  methods: {
    uploadGeoFile(event) {
      const reader = new FileReader();

      reader.onload = function () {
        this.$refs.map.setDocumentGeometryFromGeoFile(reader.result);
      }.bind(this);

      const file = event.target.files[0];
      if (file.type === 'application/vnd.ant.fit' || file.name.toLowerCase().endsWith('.fit')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }

      // empty the input, because if user wan't to upload same trace
      // change event is not fired
      this.$refs.geoFileInput.value = '';
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
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.upload-button {
  position: relative;
}

input {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}

.map-container {
  height: 400px;
}
</style>
