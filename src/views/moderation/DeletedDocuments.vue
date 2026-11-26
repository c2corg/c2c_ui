<template>
  <div>
    <p class="mb-4" v-translate>
      The documents deleted or merged in the last 29 days. A moderator can restore them, with their history,
      associations and comments, or undo the merge.
    </p>

    <div class="filters columns is-multiline is-variable is-2 mb-4">
      <div class="column is-narrow">
        <label class="label" v-translate>Deleted or merged</label>
        <div class="select">
          <select v-model="filters.kind" class="kind-filter" @change="reload">
            <option value="">{{ $gettext('All') }}</option>
            <option value="deleted">{{ $gettext('Deleted') }}</option>
            <option value="merged">{{ $gettext('Merged') }}</option>
          </select>
        </div>
      </div>
      <div class="column is-narrow">
        <label class="label" v-translate>Type</label>
        <div class="select">
          <select v-model="filters.type" class="type-filter" @change="reload">
            <option value="">{{ $gettext('All') }}</option>
            <option v-for="type of types" :key="type.letter" :value="type.letter">
              {{ $filters.uppercaseFirstLetter($gettext(type.name + 's')) }}
            </option>
          </select>
        </div>
      </div>
      <div v-for="role of USER_FILTERS" :key="role" class="column is-narrow user-filter">
        <label class="label">{{ role === 'author' ? $gettext('Author') : $gettext('Deleted or merged by') }}</label>
        <span v-if="users[role]" class="tag is-medium">
          {{ users[role].name }}
          <button class="delete is-small" :aria-label="$gettext('Remove')" @click="setUser(role, null)" />
        </span>
        <input-document
          v-else
          document-type="profile"
          :model-value="null"
          @update:model-value="setUser(role, $event)"
        />
      </div>
      <div class="column is-narrow">
        <label class="label" v-translate>Deleted since</label>
        <input v-model="filters.deleted_since" class="input" type="date" @change="reload" />
      </div>
      <div class="column is-narrow">
        <label class="label" v-translate>Deleted until</label>
        <input v-model="filters.deleted_until" class="input" type="date" @change="reload" />
      </div>
      <div v-if="isFiltered" class="column is-narrow is-flex is-align-items-flex-end">
        <button class="button is-text" @click="clearFilters" v-translate>Clear the filters</button>
      </div>
    </div>

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

    <div v-if="unmerged" class="notification is-success">
      <button class="delete" @click="unmerged = null" :aria-label="$gettext('Close')" />
      <span v-translate>Merge undone:</span>
      <router-link :to="documentRoute(unmerged.document_type, unmerged.result.source_document_id)">
        {{ unmerged.title }}
      </router-link>
      <div v-if="unmergedSkippedCount" class="mt-2">
        {{ $gettext('Left with the other document, changed since the merge:') }} {{ unmergedSkippedCount }}
      </div>
      <div v-if="unmerged.result.missing_files.length" class="mt-2">
        <span v-translate>Image files not found:</span>
        {{ unmerged.result.missing_files.join(', ') }}
      </div>
      <div v-if="unmerged.earlier" class="mt-2">
        {{ $gettext('The merges into it before are listed again:') }} {{ unmerged.earlier }}
      </div>
    </div>

    <div v-if="page.error" class="notification is-danger" v-translate>The deleted documents could not be loaded.</div>

    <p v-else-if="!page.loading && documents.length === 0" class="has-text-grey">
      {{
        isFiltered
          ? $gettext('No deleted or merged document matches these filters.')
          : $gettext('No deleted document to restore, nor merge to undo.')
      }}
    </p>
    <p v-else-if="isFiltered" class="has-text-grey is-size-7 mb-2">{{ $gettext('Found:') }} {{ total }}</p>

    <template v-for="document of documents" :key="document.kind + '-' + document.id">
      <merged-document-item
        v-if="document.kind === 'merged'"
        :merge="document"
        @unmerged="onUnmerged(document, $event)"
      />
      <deleted-document-item v-else :document="document" @restored="onRestored(document, $event)" />
    </template>

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
import { computed, reactive, ref, shallowRef } from 'vue';

import DeletedDocumentItem from './DeletedDocumentItem.vue';
import MergedDocumentItem from './MergedDocumentItem.vue';
import { DELETABLE_TYPES, documentRoute } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { DeletedDocumentsFilters } from '@/js/apis/c2c/ModeratorService';
import type {
  DeletedDocument,
  DeletedEntry,
  MergedDocument,
  RestoreResult,
  UnmergeResult,
} from '@/js/apis/c2c/schemas';
import constants from '@/js/constants';

const PAGE_SIZE = 30;

type UserFilter = 'author' | 'deleted_by';
const USER_FILTERS: UserFilter[] = ['author', 'deleted_by'];

const types = DELETABLE_TYPES.map((name) => ({ name, letter: constants.objectDefinitions[name]!.letter }));

const filters = reactive({ kind: '' as '' | 'deleted' | 'merged', type: '', deleted_since: '', deleted_until: '' });
// the users chosen, shown by their name
const users = reactive<Record<UserFilter, { document_id: number; name: string } | null>>({
  author: null,
  deleted_by: null,
});

const isFiltered = computed(() => Object.values(filters).some(Boolean) || Object.values(users).some(Boolean));

const documents = ref<DeletedEntry[]>([]);
const total = ref(0);
// a page answered after the filters changed is dropped
let generation = 0;
const page = shallowRef<ApiData>(load(0));
const restored = ref<{ title: string; document_type: string; result: RestoreResult } | null>(null);

const unmerged = ref<{ title: string; document_type: string; result: UnmergeResult; earlier: number } | null>(null);

const sum = (counts: Record<string, number>) => Object.values(counts).reduce((total, n) => total + n, 0);
const skippedCount = computed(() => (restored.value ? sum(restored.value.result.skipped) : 0));
const unmergedSkippedCount = computed(() => (unmerged.value ? sum(unmerged.value.result.skipped) : 0));

function query(): DeletedDocumentsFilters {
  return {
    kind: filters.kind || undefined,
    type: filters.type || undefined,
    author: users.author?.document_id,
    deleted_by: users.deleted_by?.document_id,
    deleted_since: filters.deleted_since || undefined,
    deleted_until: filters.deleted_until || undefined,
  };
}

function load(offset: number): ApiData {
  const current = generation;
  return c2c.moderator.getDeletedDocuments(offset, PAGE_SIZE, query()).then((response) => {
    if (current !== generation) {
      return;
    }
    documents.value.push(...response.data.documents);
    total.value = response.data.total;
  });
}

function reload() {
  generation += 1;
  documents.value = [];
  total.value = 0;
  page.value = load(0);
}

function setUser(role: UserFilter, user: { document_id: number; name: string } | null) {
  users[role] = user;
  reload();
}

function clearFilters() {
  Object.assign(filters, { kind: '', type: '', deleted_since: '', deleted_until: '' });
  Object.assign(users, { author: null, deleted_by: null });
  reload();
}

function loadMore() {
  page.value = load(documents.value.length);
}

function onRestored(document: DeletedDocument, result: RestoreResult) {
  // a restored document brings back the merges it was the source or target of (listed again): the list from the
  // start, unless only the deletions are listed
  unmerged.value = null;
  if (filters.kind !== 'deleted') {
    reload();
  } else {
    documents.value = documents.value.filter((d) => d.kind === 'merged' || d.id !== document.id);
    total.value -= 1;
  }
  restored.value = {
    title: document.title ?? String(document.document_id),
    document_type: document.document_type,
    result,
  };
}
function onUnmerged(merge: MergedDocument, result: UnmergeResult) {
  restored.value = null;
  unmerged.value = {
    title: merge.title ?? String(merge.document_id),
    document_type: merge.document_type,
    result,
    earlier: merge.earlier_merges.length,
  };
  if (merge.earlier_merges.length) {
    // the merge into its source before is listed now
    reload();
  } else {
    documents.value = documents.value.filter((d) => d.kind !== 'merged' || d.id !== merge.id);
    total.value -= 1;
  }
}
</script>

<style scoped>
.user-filter :deep(.input) {
  width: 14rem;
}
</style>
