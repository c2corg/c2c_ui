<template>
  <div>
    <span :id="'slider_' + uid" @click="focus" class="label">
      <slot></slot>
    </span>
    <input-slider
      ref="slider"
      v-model="_value"
      :aria-labelledby="'slider_' + uid"
      :min="min"
      :max="max"
      :step="interval"
      :tooltips="false"
      :lazy="false"
      @change="$emit('change')"
    />
  </div>
</template>

<script>
import { uidMixin } from '@/js/uid';

export default {
  mixins: [uidMixin],

  props: {
    modelValue: {
      type: Number,
      default: null,
    },
    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },
    interval: {
      type: Number,
      default: null,
    },
  },
  emits: ['change', 'update:modelValue'],

  computed: {
    _value: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },
  methods: {
    focus() {
      this.$refs.slider.$el.querySelector('[role=slider]').focus({ focusVisible: true });
    },
  },
};
</script>

<style lang="scss">
.yeti-app {
  /* customization of the slider (@vueform/slider) */
  .input-slider {
    --slider-connect-bg: #{$primary};
    --slider-bg: #{$grey-lighter};
    --slider-handle-shadow: 0 0 0 2px #{$primary};
    --slider-handle-ring-color: #{$secondary};
    --slider-handle-ring-width: 4px;
    --slider-handle-width: 14px;
    --slider-handle-height: 14px;
  }
}
</style>

<style scoped>
/* the spacing of the former vue-slider-component */
.label {
  display: inline-block;
  margin-bottom: 7px;
  cursor: pointer;
  font-weight: normal;
}
</style>
