<template>
  <router-link target="_blank" :to="path">
    <button class="button is-primary is-size-7-mobile">
      <fa-icon icon="print"></fa-icon>
      <span class="is-hidden-touch">&nbsp;</span>
      <span class="is-hidden-touch" v-translate>Print search results</span>
    </button>
  </router-link>
</template>

<script>
import urlMixin from './url-mixin';

export default {
  mixins: [urlMixin],

  computed: {
    path() {
       return {path: this.documentType+'s/print',
       query: this.$route.query,
      }
    },
  },
};
</script>
