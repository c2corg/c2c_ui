<template>
  <span class="page-selector ml-1">
    <component
      :is="previousPageQuery ? 'router-link' : 'span'"
      class="pagination-link button has-text-normal"
      :disabled="!previousPageQuery || null"
      :aria-disabled="!previousPageQuery ? 'true' : null"
      :to="previousPageQuery ?? undefined"
    >
      <fa-icon icon="chevron-left" />
    </component>
    <template v-if="total !== null">
      {{ firstDocumentPosition }}-{{ lastDocumentPosition }}
      <span v-translate translate-context="1-30 of 200 results">of</span>
      {{ total }}
    </template>
    <component
      :is="nextPageQuery ? 'router-link' : 'span'"
      class="pagination-link button has-text-normal"
      :disabled="!nextPageQuery || null"
      :aria-disabled="!nextPageQuery ? 'true' : null"
      :to="nextPageQuery ?? undefined"
    >
      <fa-icon icon="chevron-right" />
    </component>
    <span class="limit-selector">
      <dropdown-button class="ml-1 mr-1" ref="limitSelector">
        <template #button>
          <span class="button is-small">
            <span>{{ queryLimit }}</span>
            &nbsp;
            <fa-icon icon="angle-down" aria-hidden="true" />
          </span>
        </template>
        <component
          v-for="l in [30, 50, 100]"
          :key="l"
          :is="'router-link'"
          class="dropdown-item is-small"
          :class="{ 'is-active': queryLimit === l }"
          :to="limitQuery(l)"
          @click="hideOnclick"
        >
          <span>{{ l }}</span>
        </component>
      </dropdown-button>
      <span v-translate translate-context="30 per page">per page</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, type PropType } from 'vue';

import { usePageQuery } from './page-query';

import type DropdownButton from '@/components/generics/DropdownButton.vue';

const props = defineProps({
  // the page of documents, and their total
  documents: {
    type: Object as PropType<{ total: number } | null>,
    default: null,
  },
});

// unknown until the first results are loaded
const total = ref<number | null>(null);
const limitSelector = useTemplateRef<InstanceType<typeof DropdownButton>>('limitSelector');

const { queryLimit, pageStart, previousPageQuery, nextPageQuery, limitQuery } = usePageQuery(total);

const firstDocumentPosition = computed(() => pageStart.value + 1);
const lastDocumentPosition = computed(() => Math.min(pageStart.value + queryLimit.value, total.value ?? Infinity));

function saveTotal() {
  if (props.documents) {
    total.value = props.documents.total;
  }
}

function hideOnclick() {
  limitSelector.value!.isActive = false;
}

watch(() => props.documents, saveTotal);
</script>

<style scoped>
.pagination-link {
  height: 1.75em;
}
@media screen and (max-width: 340px) {
  .limit-selector {
    display: none;
  }
}
</style>
