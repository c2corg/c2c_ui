<template>
  <span class="page-selector ml-1">
    <component
      :is="previousPageQuery ? 'router-link' : 'span'"
      class="pagination-link button has-text-normal"
      :disabled="!previousPageQuery"
      :aria-disabled="!previousPageQuery ? 'true' : null"
      :to="previousPageQuery"
    >
      <fa-icon icon="chevron-left" />
    </component>
    {{ firstDocumentPosition }}-{{ lastDocumentPosition }}
    <span v-translate translate-context="1-30 of 200 results">of</span>
    {{ total }}
    <component
      :is="nextPageQuery ? 'router-link' : 'span'"
      class="pagination-link button has-text-normal"
      :disabled="!nextPageQuery"
      :aria-disabled="!nextPageQuery ? 'true' : null"
      :to="nextPageQuery"
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
          @click.native="hideOnclick"
        >
          <span>{{ l }}</span>
        </component>
      </dropdown-button>
      <span v-translate translate-context="30 per page">per page</span>
    </span>
  </span>
</template>

<script>
import pageQueryMixin from './page-query-mixin';

export default {
  mixins: [pageQueryMixin],

  props: {
    documents: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      total: 30,
    };
  },

  computed: {
    firstDocumentPosition() {
      return this.pageStart + 1;
    },
    lastDocumentPosition() {
      return Math.min(this.pageStart + this.queryLimit, this.total);
    },
  },

  watch: {
    documents: 'saveTotal',
  },

  methods: {
    saveTotal() {
      if (this.documents) {
        this.total = this.documents.total;
      }
    },

    hideOnclick() {
      this.$refs.limitSelector.isActive = false;
    },
  },
};
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
