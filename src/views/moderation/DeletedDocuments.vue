<template>
  <div>
    <p class="mb-4" v-translate>
      The documents deleted in the last 29 days. A moderator can restore them, with their history, associations and
      comments.
    </p>

    <div v-if="restored" class="notification is-success">
      <button class="delete" @click="restored = null" :aria-label="$gettext('Close')" />
      <span v-translate>Restored:</span>
      <router-link :to="documentRoute(restored.document_type, restored.result.document_id, restored.result.lang)">
        {{ restored.title }}
      </router-link>
      <div v-if="skippedCount" class="mt-2">
        {{ $gettext('Links not restored, their other document was deleted since:') }} {{ skippedCount }}
      </div>
      <div v-if="restored.result.missing_files.length" class="mt-2">
        <span v-translate>Image files not found:</span>
        {{ restored.result.missing_files.join(', ') }}
      </div>
    </div>

    <div v-if="page.error" class="notification is-danger" v-translate>The deleted documents could not be loaded.</div>

    <p v-else-if="!page.loading && documents.length === 0" class="has-text-grey" v-translate>
      No deleted document to restore.
    </p>

    <deleted-document-item
      v-for="document of documents"
      :key="document.id"
      :document="document"
      @restored="onRestored(document, $event)"
    />

    <div class="has-text-centered mt-4">
      <button
        v-if="documents.length < total"
        class="button"
        :class="{ 'is-loading': page.loading }"
        @click="loadMore"
        v-translate
      >
        More
      </button>
      <span v-else-if="page.loading" class="button is-loading is-white" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import DeletedDocumentItem from './DeletedDocumentItem.vue';
import { documentRoute } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { DeletedDocument, RestoreResult } from '@/js/apis/c2c/schemas';

const PAGE_SIZE = 30;

const documents = ref<DeletedDocument[]>([]);
const total = ref(0);
const page = ref<ApiData>(load(0));
const restored = ref<{ title: string; document_type: string; result: RestoreResult } | null>(null);

const skippedCount = computed(() =>
  restored.value ? Object.values(restored.value.result.skipped).reduce((sum, n) => sum + n, 0) : 0
);

function load(offset: number): ApiData {
  return c2c.moderator.getDeletedDocuments(offset, PAGE_SIZE).then((response) => {
    documents.value.push(...response.data.documents);
    total.value = response.data.total;
  });
}

function loadMore() {
  page.value = load(documents.value.length);
}

function onRestored(document: DeletedDocument, result: RestoreResult) {
  documents.value = documents.value.filter((d) => d.id !== document.id);
  total.value -= 1;
  restored.value = {
    title: document.title ?? String(document.document_id),
    document_type: document.document_type,
    result,
  };
}
</script>
