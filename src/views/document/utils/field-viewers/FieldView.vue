<template>
  <label-value v-if="hasValue && visible" :label="label">
    <document-field
      :document="document"
      :field="field"
      :unit="unit || field.unit"
      :divisor="divisor"
      :prefix="prefix"
      :sort-values="sortValues"
    />
  </label-value>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import LabelValue from './LabelValue.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty, fieldProperty } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  ...fieldProperty,
  unit: {
    type: String,
    default: null,
  },
  divisor: {
    type: Number,
    default: null,
  },
  prefix: {
    type: String,
    default: null,
  },
  context: {
    type: String,
    default: null,
  },
  sortValues: {
    type: Boolean,
    default: false,
  },
});

const { $gettext } = useGlobalProperties();

const hasValue = computed(() => {
  const value = props.document[props.field.name];

  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value) && !value.length) {
    return false;
  }

  return true;
});

const visible = computed(() => props.field.isVisibleFor(props.document));

const label = computed(() => $gettext(props.field.name, props.context));
</script>
