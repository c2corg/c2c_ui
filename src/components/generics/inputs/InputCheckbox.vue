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

<script>
import { baseInputProps, useInputValue } from './input-value';

import { useUid } from '@/js/uid';

export default {
  props: {
    ...baseInputProps,
    modelValue: {
      type: Boolean,
      default: null,
    },
  },

  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    return { ...useInputValue(props, emit), ...useUid() };
  },
};
</script>

<style scoped>
.input-checkbox {
  /* extension radio has removed padding around inputs */
  display: inline-block;
  padding-bottom: calc(0.375em - 1px);
}
</style>
