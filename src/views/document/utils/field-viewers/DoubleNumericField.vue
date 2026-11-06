<template>
  <label-value v-if="hasValue1 && hasValue2" :label="label">
    <span>{{ signPlus }}{{ displayed1.value }}&nbsp;{{ displayed1.unit }}</span>
    <span>/</span>
    <span>{{ signMinus }}{{ displayed2.value }}&nbsp;{{ displayed2.unit }}</span>
  </label-value>
  <field-view v-else-if="hasValue1" :document="document" :field="field1" />
  <field-view v-else-if="hasValue2" :document="document" :field="field2" />
</template>

<script setup lang="ts">
import { type PropType, computed } from 'vue';

import FieldView from './FieldView.vue';
import LabelValue from './LabelValue.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import type Field from '@/js/constants/Field';
import { documentProperty } from '@/js/properties';
import { displayValueAndUnit } from '@/js/units';

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

// in the units the user chose (meters or feet...)
const { $appSettings } = useGlobalProperties();
const displayed1 = computed(() => displayValueAndUnit(value1.value, props.field1.unit ?? '', null, $appSettings.units));
const displayed2 = computed(() => displayValueAndUnit(value2.value, props.field2.unit ?? '', null, $appSettings.units));

const hasValue1 = computed(() => value1.value !== null && value1.value !== undefined);

const hasValue2 = computed(() => value2.value !== null && value2.value !== undefined);

const signPlus = computed(() => (props.showSigns ? '+' : ''));

const signMinus = computed(() => (props.showSigns ? '-' : ''));
</script>
