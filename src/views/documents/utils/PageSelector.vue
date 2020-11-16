<template>
  <span class="page-selector ml-1">
    <component
      :is="firstDocumentPosition > 0 ? 'router-link' : 'span'"
      class="pagination-link has-text-normal"
      :disabled="firstDocumentPosition === 1"
      :to="pageQuery(offset - queryLimit, queryLimit)"
    >
      <fa-icon icon="chevron-left" />
    </component>
    <dropdown-button ref="pageSelector">
      <span slot="button" class="button is-small">
        {{ Math.floor(offset / queryLimit) + 1 }}
        &nbsp;
        <span v-translate translate-context="2 of 200 result pages">of</span>
        &nbsp;
        {{ pagesCount }}
        &nbsp;
        <fa-icon icon="angle-down" aria-hidden="true" />
      </span>
      <component
        v-for="n in pagesCount"
        v-bind:key="n"
        :is="'router-link'"
        class="dropdown-item is-small"
        :to="pageQuery((n - 1) * queryLimit, queryLimit)"
        @click.native="(e) => hideOnclick('pageSelector')"
      >
        {{ n }}
        &nbsp;
        <span v-translate translate-context="2 of 200 result pages">of</span>
        &nbsp;
        {{ pagesCount }}
      </component>
    </dropdown-button>
    <component
      :is="lastDocumentPosition < total ? 'router-link' : 'span'"
      class="pagination-link has-text-normal"
      :disabled="lastDocumentPosition >= total"
      :to="pageQuery(offset + queryLimit, queryLimit)"
    >
      <fa-icon icon="chevron-right" />
    </component>
    <dropdown-button class="ml-2" ref="limitSelector">
      <span slot="button" class="button is-small">
        <span>{{ queryLimit }}</span>
        &nbsp;
        <fa-icon icon="angle-down" aria-hidden="true" />
      </span>
      <component
        v-for="l in [30, 60, 90]"
        v-bind:key="l"
        :is="'router-link'"
        class="dropdown-item is-small"
        :class="{ 'is-active': queryLimit === l }"
        :to="pageQuery(offset, l)"
        @click.native="(e) => hideOnclick('limitSelector')"
      >
        <span>{{ l }}</span>
      </component>
    </dropdown-button>
    <span v-translate>results</span>
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
    pagesCount() {
      return Math.ceil(this.total / this.queryLimit);
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
      query.limit = Math.max(Math.min(limit, 90), 30);
      return { name: this.$route.name, params: this.$route.params, query };
    },

    hideOnclick(menu) {
      this.$refs[menu].isActive = false;
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
