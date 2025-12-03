<template>
  <span class="page-selector ml-1">
    <!-- chevron left -->
    <span
      v-if="firstDocumentPosition > 0"
      class="pagination-link button has-text-normal"
      @click="pageQuery(offset - limit, limit)"
    >
      <fa-icon icon="chevron-left" />
    </span>
    <span v-else class="pagination-link button has-text-normal is-disabled">
      <fa-icon icon="chevron-left" />
    </span>
    <!-- docs showed / total -->
    {{ total === 0 ? 0 : firstDocumentPosition + 1 }}-{{ lastDocumentPosition }}
    <span v-translate translate-context="1-30 of 200 results">of</span>
    {{ total }}
    <!-- chevron right -->
    <span
      v-if="lastDocumentPosition < total"
      class="pagination-link button has-text-normal"
      @click="pageQuery(offset + limit, limit)"
    >
      <fa-icon icon="chevron-right" />
    </span>
    <span v-else class="pagination-link button has-text-normal is-disabled">
      <fa-icon icon="chevron-right" />
    </span>
    <span class="limit-selector">
      <dropdown-button class="ml-1 mr-1" ref="limitSelector">
        <span slot="button" class="button is-small">
          <span>{{ limit }}</span>
          &nbsp;
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>
        <span
          v-for="l in [30, 50, 100]"
          :key="l"
          class="dropdown-item is-small"
          :class="{ 'is-active': limit === l }"
          @click="selectLimit(l)"
        >
          {{ l }}
        </span>
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
    offset: {
      type: Number,
      default: 0,
    },
    limit: {
      type: Number,
      default: 30,
    },
  },

  data() {
    return {
      total: 30,
    };
  },

  computed: {
    firstDocumentPosition() {
      return Math.max(this.offset, 0);
    },
    lastDocumentPosition() {
      return Math.min(this.offset + this.limit, this.total);
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

    pageQuery(off, lim) {
      // emit to parent that offset and limit have changed
      this.$emit('paginate', [Math.max(off, 0), lim]);
    },

    hideOnclick() {
      this.$refs.limitSelector.isActive = false;
    },

    selectLimit(l) {
      // emit to parent that offset and limit have changed
      this.$emit('paginate', [this.offset, l]);
      this.hideOnclick();
    },
  },
};
</script>

<style scoped lang="scss">
.pagination-link {
  height: 1.75em;
}

.limit-selector {
  cursor: pointer;
}

.is-active {
  background-color: #337ab7 !important;
  color: #fff !important;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #0a0a0a;
}

@media screen and (max-width: 340px) {
  .limit-selector {
    display: none;
  }
}
</style>
