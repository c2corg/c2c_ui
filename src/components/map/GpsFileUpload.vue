<template>
  <div class="control">
    <input
      ref="geoFileInput"
      type="file"
      @change="uploadGeoFile"
      accept=".gpx,.kml,.fit,.tcx,application/gpx+xml,application/vnd.ant.fit,application/vnd.google-earth.kml+xml,application/vnd.garmin.tcx+xml"
    />
    <button class="button is-primary is-small" @click="geoFileInput?.click()">
      <slot><span v-translate>Choose file</span></slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';

const emit = defineEmits(['click']);

const geoFileInput = useTemplateRef<HTMLInputElement>('geoFileInput');

function uploadGeoFile(event: Event) {
  const reader = new FileReader();

  reader.onload = () => {
    emit('click', reader.result);
  };

  const file = (event.target as HTMLInputElement).files![0];
  if (file.type === 'application/vnd.ant.fit' || file.name.toLowerCase().endsWith('.fit')) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }

  // empty the input, because if user wants to upload same trace
  // change event is not fired
  geoFileInput.value!.value = '';
}
</script>

<style scoped lang="scss">
input {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}
</style>
