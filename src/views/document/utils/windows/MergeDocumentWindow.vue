<template>
  <modal-card ref="modalWindow">
    <template #title>
      <span>
        <span v-translate>Merge documents</span>
      </span>
    </template>

    <section>
      <div class="notification is-warning has-text-centered has-text-weight-bold" v-translate>
        Warning: This action cannot be undone!
      </div>
      <div class="has-padding-bottom">
        <span v-translate>
          Merging a source document with a target document transfers all associations of the source document to the
          target document, and sets up a redirection from the source to the target document.
        </span>
        <span>&nbsp;</span>
        <span class="has-text-weight-bold" v-translate>
          Note that comments have to be transferred manually in Discourse before merging.
        </span>
      </div>

      <div class="has-padding-bottom">
        <div class="has-text-weight-bold" v-translate>Source:</div>
        <fa-icon icon="check-circle" class="has-text-success" />
        <merge-document-link :document="document" />
      </div>

      <div class="has-padding-bottom">
        <div>
          <span class="has-text-weight-bold" v-translate>Target:</span>
          <input-document
            :document-type="documentType"
            v-model="targetDocument"
            :show-options="false"
            @load-options="options = $event"
            is-small
          />
        </div>
        <div v-if="targetDocument">
          <fa-icon icon="check-circle" class="has-text-success" />
          <merge-document-link :document="targetDocument" />
        </div>
      </div>

      <div v-for="target of possibleTargets" :key="target.documentId" class="columns is-mobile is-variable is-1">
        <div class="column">
          <merge-document-link :document="target" />
        </div>
        <div class="column is-narrow">
          <button class="button is-success is-small" @click="select(target)">select</button>
        </div>
      </div>
    </section>

    <template #footer>
      <footer>
        <button :disabled="targetDocument === null" @click="mergeDocuments" class="button is-success" v-translate>
          Merge documents
        </button>
        <button @click="hide()" class="button" v-translate>Cancel</button>
      </footer>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';

import MergeDocumentLink from './MergeDocumentLink.vue';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({ ...documentProperty });

const { $gettext } = useGlobalProperties();
const { documentType } = useDocumentType(props);

const targetDocument = ref<C2cDocument | null>(null);
// the documents found by the search input, by type ("routes"...)
const options = ref<Record<string, { documents: C2cDocument[] }> | null>(null);
const modalWindowRef = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');

const possibleTargets = computed(() => {
  if (options.value) {
    return options.value[documentType.value + 's'].documents;
  } else {
    return [];
  }
});

function hide() {
  modalWindowRef.value!.hide();
}

function show() {
  modalWindowRef.value!.show();
}

function select(target: C2cDocument) {
  targetDocument.value = target;
  options.value = null;
}

function mergeDocuments() {
  if (window.confirm($gettext('Are you sure you want to merge?'))) {
    c2c.moderator.mergeDocuments(props.document.document_id!, targetDocument.value!.document_id!).then(() => {
      // TODO feedback
      hide();
    });
  }
}

defineExpose({ show });
</script>

<style scoped lang="scss">
.modal-card-body,
.modal-card,
.modal {
  overflow: visible !important;
}

.column {
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
}

.has-padding-bottom {
  padding-bottom: 1rem;
}
</style>
