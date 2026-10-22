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

<script>
import { baseMixin } from './mixins';

export default {
  compatConfig: { COMPONENT_V_MODEL: false },

  mixins: [baseMixin],

  props: {
    // YYYY-MM-DD, as stored by the API
    modelValue: {
      type: String,
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
  },

  emits: ['update:modelValue'],

  methods: {
    onInput(event) {
      // an empty value is a cleared (or not yet complete) date
      this.$emit('update:modelValue', event.target.value || null);
    },
  },
};
</script>

<style scoped>
.input-date {
  /* the width of the former vuejs-datepicker field */
  width: 193px;
}
</style>
