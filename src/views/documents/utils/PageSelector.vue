<template>
  <span class="page-selector ml-1">
    <component
      :is="firstDocumentPosition > 0 ? 'router-link' : 'span'"
      class="pagination-link button has-text-normal"
      :disabled="firstDocumentPosition === 1"
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
      :disabled="lastDocumentPosition >= total"
      :to="pageQuery(offset + queryLimit, queryLimit)"
    >
      <fa-icon icon="chevron-right" />
    </component>
    <span class="limit-selector">
      <dropdown-button class="ml-1 mr-1" ref="limitSelector">
        <span slot="button" class="button is-small">
          <span>{{ queryLimit }}</span>
          &nbsp;
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>
        <component
          v-for="l in [30, 50, 100]"
          :key="l"
          :is="'router-link'"
          class="dropdown-item is-small"
          :class="{ 'is-active': queryLimit === l }"
          :to="pageQuery(offset, l)"
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
export default {
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
    offset() {
      return parseInt(this.$route.query.offset ?? 0);
    },
    queryLimit() {
      return parseInt(this.$route.query.limit ?? 30);
    },
    firstDocumentPosition() {
      return this.offset + 1;
    },
    lastDocumentPosition() {
      return Math.min(this.offset + this.queryLimit, this.total);
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

    pageQuery(offset, limit) {
      const query = Object.assign({}, this.$route.query);
      query.offset = Math.max(offset, 0);
      query.limit = Math.max(Math.min(limit, 100), 30);
      return { name: this.$route.name, params: this.$route.params, query };
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
