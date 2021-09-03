<template>
  <label-value v-if="hasValue1 && hasValue2" :label="label">
    <span>{{ signPlus }}{{ value1 }}&nbsp;{{ field1.unit }}</span>
    <span>/</span>
    <span>{{ signMinus }}{{ value2 }}&nbsp;{{ field2.unit }}</span>
  </label-value>
  <field-view v-else-if="hasValue1" :document="document" :field="field1" />
  <field-view v-else-if="hasValue2" :document="document" :field="field2" />
</template>

<script>
import FieldView from './FieldView';
import LabelValue from './LabelValue';

import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: {
    LabelValue,
    FieldView,
  },

  mixins: [requireDocumentProperty],

  props: {
    field1: {
      type: Object,
      required: true,
    },
    field2: {
      type: Object,
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
  },

  computed: {
    value1() {
      return this.document[this.field1.name];
    },
    value2() {
      return this.document[this.field2.name];
    },
    hasValue1() {
      return this.value1 !== null && this.value1 !== undefined;
    },
    hasValue2() {
      return this.value2 !== null && this.value2 !== undefined;
    },
    signPlus() {
      return this.showSigns ? '+' : '';
    },
    signMinus() {
      return this.showSigns ? '-' : '';
    },
  },
};
</script>
