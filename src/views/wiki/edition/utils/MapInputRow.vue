<template>
  <div>
    <div class="columns is-mobile" v-if="geomDetailEditable">
      <div class="column is-narrow">
        <div v-if="hasTrackingActivities">
          <button class="button is-primary is-small" @click="openGPSModal" v-translate>Upload a GPS track</button>
          <gps-upload-modal ref="gpsUploadModal" @data="setGeometry"></gps-upload-modal>
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
          @move="$emit('move', $event)"
        />
      </div>
      <div class="column is-6">
        <div class="field">
          <label class="label">{{ $gettext('Longitude') }}</label>
          <input-simple type="number" postfix="°E" v-model="longitude" @update:model-value="setGeometryPoint" />
        </div>
      </div>
      <div class="column is-6">
        <div class="field">
          <label class="label">{{ $gettext('Latitude') }}</label>
          <input-simple type="number" postfix="°N" v-model="latitude" @update:model-value="setGeometryPoint" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, useTemplateRef, watch, type PropType } from 'vue';

import GpsFileUpload from '@/components/map/GpsFileUpload.vue';
import GpsUploadModal from '@/components/map/GpsUploadModal.vue';
import type OlMap from '@/components/map/OlMap.vue';
import trackingService from '@/js/apis/tracking-service';
import { useFormField } from '@/js/composables/form-registration';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';
import { documentProperty } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const geoJSONFormat = new ol.format.GeoJSON();
const FORM_PROJ = 'EPSG:4326';
const DATA_PROJ = 'EPSG:3857';

const props = defineProps({
  ...documentProperty,
  geomDetailEditable: {
    type: Boolean,
    default: false,
  },
  documents: {
    type: Array as PropType<C2cDocument[] | null>,
    default: null,
  },
  initialExtent: {
    type: Array as PropType<number[] | null>,
    default: null,
  },
});

defineEmits(['move']);

const { $user } = useGlobalProperties();

// registered with the FormSection containing it: always visible, never in error
useFormField('formSection', reactive({ visible: true, hasError: false }));

const map = useTemplateRef<InstanceType<typeof OlMap>>('map');
const gpsUploadModal = useTemplateRef<InstanceType<typeof GpsUploadModal>>('gpsUploadModal');

const latitude = ref<number | string | null>(null);
const longitude = ref<number | string | null>(null);
const hasTrackingActivities = ref(false);

function openGPSModal() {
  gpsUploadModal.value!.show();
}

function setGeometry(geometry: unknown) {
  map.value!.setDocumentGeometryFromGeoFile(geometry as never);
}

function setGeometryPoint() {
  if (latitude.value === null || longitude.value === null) {
    return;
  }

  const lon = parseFloat(String(longitude.value).replace(',', '.'));
  const lat = parseFloat(String(latitude.value).replace(',', '.'));

  const point = new ol.geom.Point([lon, lat]);
  point.transform(FORM_PROJ, DATA_PROJ);
  props.document.geometry!.geom = geoJSONFormat.writeGeometry(point);
}

function setLatitudeLongitude() {
  if (!props.document?.geometry?.geom) {
    return;
  }

  const point = geoJSONFormat.readGeometry(props.document.geometry.geom) as InstanceType<typeof ol.geom.Point>;

  point.transform(DATA_PROJ, FORM_PROJ);

  const coords = point.getCoordinates();

  longitude.value = Math.round(coords[0] * 1000000) / 1000000;
  latitude.value = Math.round(coords[1] * 1000000) / 1000000;
}

watch(() => props.document?.geometry?.geom, setLatitudeLongitude, { immediate: true });

onMounted(() => {
  trackingService.getStatus($user.id!).then(
    ({ data }) => {
      if (Object.values(data).includes('configured')) {
        hasTrackingActivities.value = true;
      }
    },
    (error) => {
      // Falls back to local GPX upload only, but this should not happen silently: a request that
      // fails here (401, network, ...) looks identical to "no tracker connected" otherwise, which
      // made a JWT misconfiguration between v6_api and c2c_tracking very hard to notice.
      console.error('Error retrieving tracking status :', error);
    }
  );
});

function fitMapToDocuments() {
  return map.value!.fitMapToDocuments(true);
}

// the edition views fit the map to the associated documents
defineExpose({ fitMapToDocuments });
</script>

<style scoped lang="scss">
.upload-button {
  position: relative;
}

.map-container {
  height: 400px;
}
</style>
