<template>
  <slider
    class="input-slider"
    :value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :lazy="lazy"
    :tooltips="tooltips"
    :show-tooltip="showTooltip"
    :format="format"
    :aria-labelledby="ariaLabelledby"
    :options="options"
    @input="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
  />
</template>

<script>
import Slider from '@vueform/slider';
import '@vueform/slider/themes/default.css';

// A slider for one value, or a range when the value is an array of two
export default {
  components: { Slider },

  props: {
    modelValue: {
      type: [Number, Array],
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    // emit the value once the handle is released, not while dragging
    lazy: {
      type: Boolean,
      default: true,
    },
    tooltips: {
      type: Boolean,
      default: true,
    },
    // 'always', 'focus' or 'drag'
    showTooltip: {
      type: String,
      default: 'focus',
    },
    // text of the tooltips, from the value
    format: {
      type: Function,
      default: undefined,
    },
    ariaLabelledby: {
      type: String,
      default: undefined,
    },
    // a dot on the rail at each step
    marks: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:modelValue', 'change'],

  computed: {
    options() {
      // noUiSlider pips: filter 0 = a marker without its value, -1 = none (the density markers between steps)
      const filter = (value) => (Math.abs(value - Math.round(value)) < 1e-6 ? 0 : -1);
      return this.marks ? { pips: { mode: 'steps', filter } } : {};
    },
  },
};
</script>

<style lang="scss" scoped>
// the look of the former vue-slider-component default theme
.input-slider {
  --slider-connect-bg: #3498db;
  --slider-tooltip-bg: #3498db;
  --slider-handle-ring-color: #3498db30;
  --slider-height: 4px;

  margin: 7px 0;

  // the marks are created by noUiSlider, out of this template: :deep(). The base keeps no stacking context, so that
  // the marks go above the bar (z-index 0) and below the handles (z-index 1 and more)
  :deep(.slider-base) {
    z-index: auto;
  }

  :deep(.slider-pips) {
    position: absolute;
    z-index: 0;
    top: 50%;
    left: 0;
    width: 100%;
    pointer-events: none;
  }

  :deep(.slider-marker) {
    position: absolute;
    width: 4px;
    height: 4px;
    margin: -2px 0 0 -2px;
    border-radius: 50%;
    background: rgb(0 0 0 / 25%);
  }
}
</style>
