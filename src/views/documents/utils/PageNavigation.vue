<template>
  <nav v-if="pageCount > 1" class="page-navigation" :aria-label="$gettext('Pagination')">
    <component
      :is="previousPageQuery ? 'router-link' : 'span'"
      class="button has-text-normal"
      :disabled="!previousPageQuery || null"
      :aria-disabled="!previousPageQuery ? 'true' : null"
      :to="previousPageQuery ?? undefined"
      :aria-label="$gettext('Previous page')"
    >
      <fa-icon icon="chevron-left" />
    </component>

    <template v-for="(page, index) in pages" :key="page ?? `gap-${index}`">
      <span v-if="page === null" class="page-navigation-gap">&hellip;</span>
      <component
        v-else
        :is="page === currentPage ? 'span' : 'router-link'"
        class="button"
        :class="{ 'is-primary': page === currentPage }"
        :to="page === currentPage ? undefined : pageAt((page - 1) * queryLimit)"
        :aria-current="page === currentPage ? 'page' : null"
      >
        {{ page }}
      </component>
    </template>

    <component
      :is="nextPageQuery ? 'router-link' : 'span'"
      class="button has-text-normal"
      :disabled="!nextPageQuery || null"
      :aria-disabled="!nextPageQuery ? 'true' : null"
      :to="nextPageQuery ?? undefined"
      :aria-label="$gettext('Next page')"
    >
      <fa-icon icon="chevron-right" />
    </component>
  </nav>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import { usePageQuery } from './page-query';
import { getPages } from './pagination';

const props = defineProps({
  // the page of documents, and their total
  documents: {
    type: Object as PropType<{ total: number } | null>,
    default: null,
  },
});

const total = computed(() => props.documents?.total ?? null);

const { queryLimit, pageStart, previousPageQuery, nextPageQuery, pageAt } = usePageQuery(total);

const pageCount = computed(() => Math.ceil((total.value ?? 0) / queryLimit.value));
const currentPage = computed(() => pageStart.value / queryLimit.value + 1);
const pages = computed(() => getPages(currentPage.value, pageCount.value));
</script>

<style scoped>
.page-navigation {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem 0.5rem;
}

.page-navigation-gap {
  padding: 0 0.25rem;
}
</style>
