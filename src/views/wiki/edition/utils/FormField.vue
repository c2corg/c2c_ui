<template>
  <div :class="noWrapper ? '' : 'column'" v-show="visible">
    <div class="field">
      <label class="label">
        <marker-helper :name="helper || field.helper" />
        {{ $filters.uppercaseFirstLetter(label || fieldLabel) }}
        <span v-if="hasError" class="has-text-danger">
          <!-- $gettext('required field') -->
          <!-- $gettext('This field is too short') -->
          <!-- $gettext('This field is too long') -->
          {{ $filters.uppercaseFirstLetter(errorMessage) }}
        </span>
      </label>
      <form-input
        ref="input"
        :document="document"
        :field="field"
        :helper="null"
        :placeholder="placeholder"
        :unit="unit"
        :max="max"
        :min="min"
        :divisor="divisor"
        :is-expanded="isExpanded"
        :prefix="prefix"
        @click-prefix="$emit('click-prefix')"
      />
    </div>
  </div>
</template>

<script>
import FormInput from './FormInput';

import { formField } from '@/js/form-registration';
import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

export default {
  components: {
    FormInput,
  },

  // registered with the FormSection containing it
  mixins: [formField('formSection'), requireFieldProperty, requireDocumentProperty],

  props: {
    isExpanded: {
      type: Boolean,
      default: false,
    },
    helper: {
      type: String,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    context: {
      type: String,
      default: null,
    },
    placeholder: {
      type: String,
      default: ' ', // hack to force explicit placeholder
    },
    unit: {
      type: String,
      default: undefined,
    },
    divisor: {
      type: Number,
      default: undefined,
    },
    noWrapper: {
      type: Boolean,
      default: false,
    },
    max: {
      type: String,
      default: undefined,
    },
    min: {
      type: String,
      default: undefined,
    },
    // a button before the input (the cotometer of the ski rating), emits click-prefix
    prefix: {
      type: String,
      default: null,
    },
  },

  emits: ['click-prefix'],

  data() {
    return {
      visible: true,
    };
  },

  computed: {
    hasError() {
      return this.field.error !== null;
    },
    errorMessage() {
      return this.hasError ? this.$gettext(this.field.error.description) : null;
    },
    fieldLabel() {
      return this.$gettext(this.field.name, this.context);
    },
  },

  mounted() {
    this.$refs.input.$watch('visible', () => {
      this.visible = this.$refs.input.visible;
    });

    this.visible = this.$refs.input.visible;
  },
};
</script>
