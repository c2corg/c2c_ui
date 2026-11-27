<template>
  <!-- native date input: the browser's own picker (system picker on mobile), in the browser's language -->
  <input
    type="date"
    class="input input-date"
    :class="{ 'is-danger': hasError }"
    :value="modelValue"
    :min="min"
    :max="max"
    :required="required"
    :disabled="disabled"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import { baseInputProps } from './input-value';

defineProps({
  ...baseInputProps,
  // YYYY-MM-DD, as stored by the API
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
  // earliest and latest selectable dates (inclusive), YYYY-MM-DD
  min: {
    type: String,
    default: undefined,
  },
  max: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue']);

function onInput(event: Event) {
  // an empty value is a cleared (or not yet complete) date
  emit('update:modelValue', (event.target as HTMLInputElement).value || null);
}
</script>

<style scoped>
.input-date {
  /* the width of the former vuejs-datepicker field */
  width: 193px;
}
</style>
