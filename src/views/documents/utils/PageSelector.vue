<template>
  <span class="page-selector ml-1">
    <component
      :is="firstDocumentPosition > 0 ? 'router-link' : 'span'"
      class="pagination-link button has-text-normal"
      :disabled="firstDocumentPosition === 1 || null"
      :to="pageQuery(offset - queryLimit, queryLimit)"
    >
      <fa-icon icon="chevron-left" />
    </component>
    {{ firstDocumentPosition }}-{{ lastDocumentPosition }}
    <span v-translate translate-context="1-30 of 200 results">of</span>
    {{ total }}
    <component
      :is="lastDocumentPosition < total ? 'router-link' : 'span'"
      class="pagination-link button has-text-normal"
      :disabled="lastDocumentPosition >= total || null"
      :to="pageQuery(offset + queryLimit, queryLimit)"
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
          :to="pageQuery(offset, l)"
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
import { useRoute } from 'vue-router';

import type DropdownButton from '@/components/generics/DropdownButton.vue';

const props = defineProps({
  // the page of documents, and their total
  documents: {
    type: Object as PropType<{ total: number } | null>,
    default: null,
  },
});

const route = useRoute();

const total = ref(30);
const limitSelector = useTemplateRef<InstanceType<typeof DropdownButton>>('limitSelector');

const offset = computed(() => parseInt(String(route.query.offset ?? 0)));
const queryLimit = computed(() => parseInt(String(route.query.limit ?? 30)));
const firstDocumentPosition = computed(() => offset.value + 1);
const lastDocumentPosition = computed(() => Math.min(offset.value + queryLimit.value, total.value));

function saveTotal() {
  if (props.documents) {
    total.value = props.documents.total;
  }
}

function pageQuery(newOffset: number, limit: number) {
  const query = {
    ...route.query,
    offset: String(Math.max(newOffset, 0)),
    limit: String(Math.max(Math.min(limit, 100), 30)),
  };
  return { name: route.name, params: route.params, query };
}

function hideOnclick() {
  limitSelector.value!.isActive = false;
}

watch(() => props.documents, saveTotal);
</script>

<style scoped lang="scss">
.pagination-link {
  height: 1.75em;
}
@media screen and (max-width: 340px) {
  .limit-selector {
    display: none;
  }
}
</style>
