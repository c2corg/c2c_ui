<template>
  <div class="ol-control ol-control-drawing-mode" :class="{ 'is-primary': drawingMode }">
    <div class="ol-control-drawing-mode-inner">
      <input-checkbox @input="onDrawingMode" :value="drawingMode" :disabled="validSimplifyTolerance">
        <span v-translate :title="$gettext('Enable drawing and editing features on map')">Drawing mode</span>
      </input-checkbox>
    </div>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

export default {
  computed: {
    drawingMode() {
      return Yetix.drawingMode;
    },
    validSimplifyTolerance() {
      return Yetix.validSimplifyTolerance;
    },
  },
  methods: {
    onDrawingMode() {
      Yetix.setDrawingMode(!this.drawingMode);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.ol-control-drawing-mode {
  padding: 0 !important;

  &.is-primary {
    box-shadow: none;
  }

  .ol-control-drawing-mode-inner { {
    padding: 0.15rem 0.25rem 0;
    border-radius: 4px;
    background: $white;
    white-space: nowrap;
  }

  &.is-primary .ol-control-drawing-mode-inner {
    background: $grey-dark;
    color: $white;
  }
}
</style>

<style lang="scss">
.yeti-app {
  .ol-control-drawing-mode {
    .is-checkradio[type='checkbox'] + label {
      font-size: 0.95em;
      margin-right: 0;
    }
  }
}
</style>
