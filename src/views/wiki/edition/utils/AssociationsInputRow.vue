<template>
  <div>
    <div class="columns is-multiline">
      <div class="column is-narrow">
        <label class="label">
          {{ $filters.uppercaseFirstLetter(label || $gettext(field.name)) }}
          <marker-helper :name="helper ? helper : field.helper" />
        </label>
      </div>
      <div class="column is-narrow">
        <form-input class="is-expanded" :document="document" :field="field" />
      </div>
    </div>
    <div class="columns is-multiline">
      <div v-for="child in document.associations![field.name]" :key="child.document_id" class="column is-4">
        <document-card
          :document="child"
          :show-delete-button="showDeleteButton(child)"
          @delete="$documentUtils.removeAssociation(document, child)"
          target="_blank"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';

import FormInput from './FormInput.vue';

import { useAssociationRights } from '@/js/composables/association-rights';
import { useFormField } from '@/js/composables/form-registration';
import { documentProperty, fieldProperty } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({
  ...fieldProperty,
  ...documentProperty,
  label: {
    type: String,
    default: null,
  },

  helper: {
    type: String,
    default: undefined, // default must be undefined. null means explicit no helper
  },
});

const { canRemove } = useAssociationRights();

// as its input
const visible = computed(() => props.field.isVisibleFor(props.document));
const hasError = computed(() => props.field.error !== null);

// registered with the FormSection containing it
useFormField('formSection', reactive({ visible, hasError }));

function showDeleteButton(child: C2cDocument) {
  return canRemove(props.document, child);
}
</script>
