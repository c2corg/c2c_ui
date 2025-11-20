<template>
  <span class="page-selector ml-1">
    <!-- chevron left -->
    <span
      v-if="firstDocumentPosition > 0"
      class="pagination-link button has-text-normal"
      @click="pageQuery(offset - queryLimit, queryLimit)"
    >
      <fa-icon icon="chevron-left" />
    </span>
    <span v-else class="pagination-link button has-text-normal is-disabled">
      <fa-icon icon="chevron-left" />
    </span>
    <!-- docs showed / total -->
    {{ firstDocumentPosition }}-{{ lastDocumentPosition }}
    <span v-translate translate-context="1-30 of 200 results">of</span>
    {{ total }}
    <!-- chevron right -->
    <span
      v-if="lastDocumentPosition < total"
      class="pagination-link button has-text-normal"
      @click="pageQuery(offset + queryLimit, queryLimit)"
    >
      <fa-icon icon="chevron-right" />
    </span>
    <span v-else class="pagination-link button has-text-normal is-disabled">
      <fa-icon icon="chevron-right" />
    </span>
    <!--<span class="limit-selector">
      <dropdown-button class="ml-1 mr-1" ref="limitSelector">
        <span slot="button" class="button is-small">
          <span>{{ queryLimit }}</span>
          &nbsp;
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>
        <component
          v-for="l in [30, 50, 100]"
          :key="l"
          :is="'span'"
          class="dropdown-item is-small"
          :class="{ 'is-active': queryLimit === l }"
          @click.native="hideOnclick"
        >
          <span>{{ l }}</span>
        </component>
      </dropdown-button>
      <span v-translate translate-context="30 per page">per page</span>
    </span>-->
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
      offset: 0,
      limit: 30,
    };
  },

  computed: {
    queryLimit() {
      return this.limit ?? 30;
    },
    firstDocumentPosition() {
      return this.offset;
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
      this.offset = offset;
      this.limit = limit;
      // emit to parent that offset and limit have changed
      this.$emit('paginate', [offset, limit]);
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
