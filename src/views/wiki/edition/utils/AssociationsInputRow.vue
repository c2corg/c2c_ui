<template>
  <div>
    <div class="columns is-multiline">
      <div class="column is-narrow">
        <label class="label">
          {{ (label || $gettext(field.name)) | uppercaseFirstLetter }}
          <marker-helper :name="helper ? helper : field.helper" />
        </label>
      </div>
      <div class="column is-narrow">
        <form-input class="is-expanded" ref="input" :document="document" :field="field" />
      </div>
    </div>
    <div class="columns is-multiline">
      <div
        v-for="child in document.associations[field.name]"
        :key="child.document_id"
        class="column is-4">
        <document-card
          :document="child"
          show-delete-button
          @delete="$documentUtils.removeAssociation(document, child)"
          target="_blank" />
      </div>
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
      label: {
        type: String,
        default: null
      },

      helper: {
        type: String,
        default: undefined // default must be undefined. null means explicit no helper
      }
    },

    computed: {
      visible() {
        return this.$refs.input.visible;
      },
      hasError() {
        return this.field.error !== null;
      }
    }
  };
</script>
