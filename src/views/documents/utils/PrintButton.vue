<template>
  <router-link target="_blank" :to="path" rel="nofollow">
    <button v-if="display === 'button'" class="button is-primary is-size-7-mobile">
      <fa-icon icon="print"></fa-icon>
      <span>&nbsp;</span>
      <span v-translate>Print search results</span>
    </button>
    <span v-else class="dropdown-item">
      <fa-icon icon="print"></fa-icon>
      <span v-translate>Print search results</span>
    </span>
  </router-link>
</template>

<script>
import urlMixin from './url-mixin';

export default {
  mixins: [urlMixin],

  props: {
    display: {
      type: String,
      default: 'button',
    },
    forcedDocumentType: {
      type: String,
      default: null,
    },
    forcedQuery: {
      type: Object,
      default: null,
    },
    forcedRouteName: {
      type: String,
      default: null,
    },
  },

  computed: {
    path() {
      return {
        path: (this.forcedDocumentType ? this.forcedDocumentType : this.documentType) + 's/print',
        query: this.forcedQuery ? this.forcedQuery : this.$route.query,
        name: this.forcedRouteName ? this.forcedRouteName : null,
      };
    },
  },
};
</script>
