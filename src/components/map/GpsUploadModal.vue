<template>
  <modal-window ref="modalWindow" wide>
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

<script>
import GpsFileUpload from '@/components/map/GpsFileUpload';
import TrackingDeviceActivities from '@/components/tracking/TrackingDeviceActivities';

export default {
  components: { TrackingDeviceActivities, GpsFileUpload },

  data() {
    return {
      activeTab: 'tracking-devices',
    };
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },

    hide() {
      this.$refs.modalWindow.hide();
    },

    setGeometry(geometry) {
      this.$emit('data', geometry);
      this.hide();
    },
  },
};
</script>
