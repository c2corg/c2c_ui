<template>
  <span class="page-selector has-text-ligth">
    {{ firstDocumentPosition }}-{{ lastDocumentPosition }}
    <span v-translate translate-context="1-30 of 200 results">of</span>
    {{ total }}
    <component
      :is="firstDocumentPosition > 0 ? 'router-link' : 'span'"
      class="pagination-link has-text-normal"
      :disabled="offset === 0"
      :to="pageQuery(offset - queryLimit)"
    >
      <fa-icon icon="chevron-left" />
    </component>
    <component
      :is="lastDocumentPosition < total ? 'router-link' : 'span'"
      class="pagination-link has-text-normal"
      :disabled="lastDocumentPosition >= total"
      :to="pageQuery(offset + queryLimit)"
    >
      <fa-icon icon="chevron-right" />
    </component>
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

    pageQuery(offset) {
      const query = Object.assign({}, this.$route.query);
      query.offset = Math.max(offset, 0);
      return { name: this.$route.name, params: this.$route.params, query };
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.pagination-link {
  width: 18px;
  height: 18px;
  display: inline-block;
  text-align: center;
}

.pagination-link[disabled] {
  color: $grey-light;
}
</style>
