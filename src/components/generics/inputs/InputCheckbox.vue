<template>
  <span class="input-checkbox">
    <input
      :id="'c2c-checkbox' + uid"
      class="is-checkradio is-primary"
      type="checkbox"
      v-model="value_"
      :disabled="disabled"
      @change="$emit('change')"
    />
    <label :for="'c2c-checkbox' + uid">
      <slot />
    </label>
  </span>
</template>

<script setup lang="ts">
import { baseInputProps, useInputValue } from './input-value';

import { useUid } from '@/js/uid';

const props = defineProps({
  ...baseInputProps,
  modelValue: {
    type: Boolean,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue', 'change']);

const { value_ } = useInputValue(props, emit);
const { uid } = useUid();
</script>

<style scoped>
.input-checkbox {
  /* extension radio has removed padding around inputs */
  display: inline-block;
  padding-bottom: calc(0.375em - 1px);
}
</style>
