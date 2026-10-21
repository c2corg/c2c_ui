<template>
  <nav v-if="pageCount > 1" class="page-navigation" :aria-label="$gettext('Pagination')">
    <component
      :is="currentPage > 1 ? 'router-link' : 'span'"
      class="button has-text-normal"
      :disabled="currentPage <= 1"
      :aria-disabled="currentPage <= 1 ? 'true' : null"
      :to="pageQuery((currentPage - 2) * queryLimit, queryLimit)"
      :aria-label="$gettext('Previous page')"
    >
      <fa-icon icon="chevron-left" />
    </component>

    <template v-for="(page, index) in pages">
      <span v-if="page === null" :key="`gap-${index}`" class="page-navigation-gap">&hellip;</span>
      <component
        v-else
        :key="page"
        :is="page === currentPage ? 'span' : 'router-link'"
        class="button"
        :class="{ 'is-primary': page === currentPage }"
        :to="pageQuery((page - 1) * queryLimit, queryLimit)"
        :aria-current="page === currentPage ? 'page' : null"
      >
        {{ page }}
      </component>
    </template>

    <component
      :is="currentPage < pageCount ? 'router-link' : 'span'"
      class="button has-text-normal"
      :disabled="currentPage >= pageCount"
      :aria-disabled="currentPage >= pageCount ? 'true' : null"
      :to="pageQuery(currentPage * queryLimit, queryLimit)"
      :aria-label="$gettext('Next page')"
    >
      <fa-icon icon="chevron-right" />
    </component>
  </nav>
</template>

<script>
import pageQueryMixin from './page-query-mixin';
import { getPages } from './pagination';

export default {
  mixins: [pageQueryMixin],

  props: {
    documents: {
      type: Object,
      default: null,
    },
  },

  computed: {
    total() {
      return this.documents?.total ?? 0;
    },
    pageCount() {
      return Math.ceil(this.total / this.queryLimit);
    },
    currentPage() {
      return Math.floor(this.offset / this.queryLimit) + 1;
    },
    pages() {
      return getPages(this.currentPage, this.pageCount);
    },
  },
};
</script>

<style scoped lang="scss">
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
