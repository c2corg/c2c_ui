<template>
  <div class="section">
    <html-header :title="$gettext('Associations history')" />

    <association-history-pagination
      :count="results ? results.count : 0"
      :limit="limit ?? undefined"
      :offset="offset ?? undefined"
      :document-id="documentId ?? undefined"
      :user-id="userId ?? undefined"
    />

    <loading-notification :promise="promise" />

    <table v-if="results" class="table is-striped">
      <thead>
        <tr>
          <th v-translate>Created on</th>
          <th v-translate>Contributor</th>
          <th v-translate>Creation?</th>
          <th v-translate>Parent</th>
          <th v-translate>Child</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(association, i) of results.associations" :key="i">
          <td>
            {{ $dateUtils.toTechnicalString(association.written_at) }}
          </td>
          <td>
            <contributor-link :contributor="association.user" />
          </td>
          <td>
            {{ association.is_creation }}
          </td>
          <td>
            <colored-icon-document :document-type="$documentUtils.getDocumentType(association.parent_document.type)" />
            <span>&nbsp;</span>
            <document-link :document="association.parent_document" />
          </td>
          <td>
            <colored-icon-document :document-type="$documentUtils.getDocumentType(association.child_document.type)" />
            <span>&nbsp;</span>
            <document-link :document="association.child_document" />
          </td>
        </tr>
      </tbody>
    </table>
    <association-history-pagination
      :count="results ? results.count : 0"
      :limit="limit ?? undefined"
      :offset="offset ?? undefined"
      :document-id="documentId ?? undefined"
      :user-id="userId ?? undefined"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import AssociationHistoryPagination from './utils/AssociationHistoryPagination.vue';
import ColoredIconDocument from './utils/ColoredIconDocument.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { useNoRobots } from '@/js/composables/head';

useNoRobots();

const route = useRoute();

const promise = ref<ApiData | { data?: undefined }>({});

// the filters of the url: u (user), d (document), offset and limit
const queryNumber = (key: string) => (route.query[key] ? parseInt(String(route.query[key])) : null);

const userId = computed(() => queryNumber('u'));
const documentId = computed(() => queryNumber('d'));
const offset = computed(() => queryNumber('offset'));
const limit = computed(() => queryNumber('limit'));
const results = computed(() => promise.value.data);

function load() {
  promise.value = c2c.association.getHistory({
    documentId: documentId.value ?? undefined,
    userId: userId.value ?? undefined,
    limit: limit.value ?? undefined,
    offset: offset.value ?? undefined,
  });
}

watch(() => route.fullPath, load, { immediate: true });
</script>

<style scoped>
td:nth-child(1),
td:nth-child(2) {
  white-space: nowrap;
}
</style>
