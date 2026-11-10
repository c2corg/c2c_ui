<template>
  <modal-window ref="modal" wide>
    <div class="tabs">
      <ul>
        <li :class="{ 'is-active': activeTab === 'tracking-devices' }">
          <a @click="activeTab = 'tracking-devices'"
            ><fa-icon icon="location-crosshairs"></fa-icon>&nbsp;<span v-translate>Tracking devices</span></a
          >
        </li>
        <li :class="{ 'is-active': activeTab === 'file' }">
          <a @click="activeTab = 'file'"
            ><fa-icon icon="file-download"></fa-icon>&nbsp;<span v-translate>Local file</span></a
          >
        </li>
      </ul>
    </div>
    <tracking-device-activities
      @geojson="setGeometry"
      v-if="activeTab === 'tracking-devices'"
    ></tracking-device-activities>
    <gps-file-upload @click="setGeometry" v-if="activeTab === 'file'"></gps-file-upload>
  </modal-window>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import GpsFileUpload from '@/components/map/GpsFileUpload.vue';
import TrackingDeviceActivities from '@/components/tracking/TrackingDeviceActivities.vue';

const emit = defineEmits(['data']);

const activeTab = ref('tracking-devices');
const modal = useTemplateRef<{ show(): void; hide(): void }>('modal');

function show() {
  modal.value!.show();
}

function hide() {
  modal.value!.hide();
}

function setGeometry(geometry: unknown) {
  emit('data', geometry);
  hide();
}

// the map input of the edition forms opens it
defineExpose({ show });
</script>
