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

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import { useUid } from '@/js/uid';

const props = defineProps({
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
});

const emit = defineEmits(['change', 'update:modelValue']);

const { uid } = useUid();
const slider = useTemplateRef<{ $el: HTMLElement }>('slider');

const _value = computed({
  get: () => props.modelValue,
  set(value) {
    emit('update:modelValue', value);
  },
});

function focus() {
  slider.value!.$el.querySelector<HTMLElement>('[role=slider]')!.focus({ focusVisible: true });
}
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
