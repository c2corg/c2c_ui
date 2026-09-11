<template>
  <div>
    <span :id="'slider_' + uid" @click="focus" class="label">
      <slot></slot>
    </span>
    <vue-slider
      ref="slider"
      v-model="_value"
      :dot-attrs="{ 'aria-labelledby': 'slider_' + uid }"
      :min="min"
      :max="max"
      :interval="interval"
      tooltip="none"
      :duration="0"
      :contained="true"
      @change="$emit('change')"
    />
  </div>
</template>

<script>
import 'vue-slider-component/theme/default.css';
import VueSlider from 'vue-slider-component';

import { nextUid } from '@/js/uid';

export default {
  components: {
    VueSlider,
  },
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
  data() {
    return {
      uid: nextUid(),
    };
  },
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
      this.$refs.slider.$el.querySelector('.vue-slider-dot').focus({ focusVisible: true });
    },
  },
};
</script>

<style lang="scss">
.yeti-app {
  /* customization of vue-slider */
  $dotSize: 14px;
  .vue-slider-process {
    background: $primary;
    box-shadow: calc(-1 * $dotSize / 2) 0 $primary;
  }
  .vue-slider-rail {
    background: $grey-lighter;
    box-shadow: calc(-1 * $dotSize / 2) 0 $grey-lighter, calc($dotSize / 2) 0 $grey-lighter;
  }
  .vue-slider-dot-handle {
    box-shadow: 0 0 0 2px $primary;
  }
  .vue-slider-dot:focus-visible {
    box-shadow: 0 0 0 4px $secondary;
    border-radius: $dotSize;
  }
}
</style>

<style scoped>
.label {
  cursor: pointer;
  font-weight: normal;
}
</style>
