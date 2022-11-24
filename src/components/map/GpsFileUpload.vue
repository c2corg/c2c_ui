<template>
  <div class="control">
    <input
      ref="geoFileInput"
      type="file"
      @change="uploadGeoFile"
      accept=".gpx,.kml,.fit,.tcx,application/gpx+xml,application/vnd.ant.fit,application/vnd.google-earth.kml+xml,application/vnd.garmin.tcx+xml"
    />
    <button class="button is-primary is-small" @click="$refs.geoFileInput.click()">
      <slot><span v-translate>Choose file</span></slot>
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    uploadGeoFile(event) {
      const reader = new FileReader();

      reader.onload = function () {
        this.$emit('click', reader.result);
      }.bind(this);

      const file = event.target.files[0];
      if (file.type === 'application/vnd.ant.fit' || file.name.toLowerCase().endsWith('.fit')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }

      // empty the input, because if user wants to upload same trace
      // change event is not fired
      this.$refs.geoFileInput.value = '';
    },
  },
};
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
