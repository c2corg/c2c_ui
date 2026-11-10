<template>
  <label-value v-if="hasValue1 && hasValue2" :label="label">
    <span>{{ signPlus }}{{ value1 }}&nbsp;{{ field1.unit }}</span>
    <span>/</span>
    <span>{{ signMinus }}{{ value2 }}&nbsp;{{ field2.unit }}</span>
  </label-value>
  <field-view v-else-if="hasValue1" :document="document" :field="field1" />
  <field-view v-else-if="hasValue2" :document="document" :field="field2" />
</template>

<script setup lang="ts">
import { type PropType, computed } from 'vue';

import FieldView from './FieldView.vue';
import LabelValue from './LabelValue.vue';

import type Field from '@/js/constants/Field';
import { documentProperty } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  field1: {
    type: Object as PropType<Field>,
    required: true,
  },
  field2: {
    type: Object as PropType<Field>,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  showSigns: {
    type: Boolean,
    default: false,
  },
});

const value1 = computed(() => props.document[props.field1.name]);

const value2 = computed(() => props.document[props.field2.name]);

const hasValue1 = computed(() => value1.value !== null && value1.value !== undefined);

const hasValue2 = computed(() => value2.value !== null && value2.value !== undefined);

const signPlus = computed(() => (props.showSigns ? '+' : ''));

const signMinus = computed(() => (props.showSigns ? '-' : ''));
</script>
