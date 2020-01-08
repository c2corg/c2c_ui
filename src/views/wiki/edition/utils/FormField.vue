<template>
  <div :class="noWrapper ? '' : 'column'" v-show="visible">
    <div class="field">
      <label class="label">
        <marker-helper :name="helper || field.helper" />
        {{ label || $gettext(field.name) | uppercaseFirstLetter }}
        <span v-if="hasError" class="has-text-danger">
          <!-- $gettext('required field') -->
          <!-- $gettext('This field is too short') -->
          <!-- $gettext('This field is too long') -->
          {{ errorMessage | uppercaseFirstLetter }}
        </span>
      </label>
      <form-input
        ref="input"
        :document="document"
        :field="field"
        :helper="null"
        :placeholder="placeholder"
        :unit="unit"
        :divisor="divisor"
        :single-select="singleSelect"
        :is-expanded="isExpanded" />
    </div>
  </div>
</template>

<script>
  import FormInput from './FormInput';

  import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

  export default {
    components: {
      FormInput
    },

    mixins: [ requireFieldProperty, requireDocumentProperty ],

    props: {
      isExpanded: {
        type: Boolean,
        default: false
      },
      helper: {
        type: String,
        default: undefined
      },
      label: {
        type: String,
        default: undefined
      },
      placeholder: {
        type: String,
        default: ' ' // hack to force explicit placeholder
      },
      unit: {
        type: String,
        default: undefined
      },
      divisor: {
        type: Number,
        default: undefined
      },
      noWrapper: {
        type: Boolean,
        default: false
      },
      singleSelect: {
        type: Boolean,
        default: false
      }
    },

    data() {
      return {
        visible: true
      };
    },

    computed: {
      hasError() {
        return this.field.error !== null;
      },
      errorMessage() {
        return this.hasError ? this.$gettext(this.field.error.description) : null;
      }
    },

    mounted() {
      this.$refs.input.$watch('visible', () => {
        this.visible = this.$refs.input.visible;
      });

      this.visible = this.$refs.input.visible;
    }
  };
</script>
