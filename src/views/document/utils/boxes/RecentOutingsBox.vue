<template>
  <div class="box no-print" v-if="!isDraftView && (documentType == 'route' || outings.length !== 0)">
    <div class="title is-2">
      <span v-if="documentType === 'image'" v-translate>Associated outings</span>
      <span v-else v-translate>Last outings</span>
    </div>

    <div v-for="(outing, i) of outings" :key="i">
      <pretty-outing-link :outing="outing" />
    </div>

    <div
      v-if="(!hideSeeAllResultsButton && outings.length) || documentType == 'route'"
      class="has-text-centered add-section"
    >
      <router-link
        :to="{ name: 'outings', query: query }"
        class="button is-primary"
        v-if="!hideSeeAllResultsButton && outings.length"
      >
        <span v-translate>show all</span>&nbsp;<span class="badge">{{ totalOutings }}</span>
      </router-link>
      <add-link v-if="documentType == 'route'" document-type="outing" :query="query" class="button is-primary">
        <span v-translate v-if="outings.length === 0">Add the first outing</span>
      </add-link>
    </div>
  </div>
</template>

<script>
import viewModeMixin from '../view-mode-mixin';

import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty, viewModeMixin],

  props: {
    hideSeeAllResultsButton: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    outings() {
      return (this.document.associations.recent_outings?.documents || this.document.associations.outings).filter(
        (outing) => outing.quality !== 'empty'
      );
    },

    totalOutings() {
      return this.document.associations.recent_outings?.total || outings.length;
    },

    query() {
      const query = {};
      query[this.document.type] = this.document.document_id;
      return query;
    },
  },
};
</script>

<style scoped lang="scss">
.button {
  vertical-align: bottom;
  margin-left: 1rem;
}

.add-section {
  margin-top: 1.5rem;
}

.badge {
  @include button-badge-primary;
}
</style>
