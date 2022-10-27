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

<script>
import LabelValue from './LabelValue';

import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

export default {
  components: { LabelValue },

  mixins: [requireDocumentProperty, requireFieldProperty],

  props: {
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
  },

  computed: {
    hasValue() {
      const value = this.document[this.field.name];

      if (value === undefined || value === null) {
        return false;
      }

      if (Array.isArray(value) && !value.length) {
        return false;
      }

      return true;
    },

    visible() {
      return this.field.isVisibleFor(this.document);
    },

    label() {
      return this.$gettext(this.field.name, this.context);
    },
  },
};
</script>
