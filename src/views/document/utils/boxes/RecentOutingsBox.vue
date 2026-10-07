<template>
  <div class="box no-print" v-if="!isDraftView && (showAddOutingButton || outings.length !== 0)">
    <div class="title is-2">
      <span v-if="['image', 'article'].includes(documentType)" v-translate>Associated outings</span>
      <span v-else v-translate>Last outings</span>
    </div>

    <div v-for="(outing, i) of outings" :key="i">
      <pretty-outing-link :outing="outing" />
    </div>

    <div
      v-if="(!hideSeeAllResultsButton && outings.length) || showAddOutingButton"
      class="has-text-centered add-section"
    >
      <router-link
        :to="{ name: 'outings', query: allOutingsQuery }"
        class="button is-primary"
        v-if="!hideSeeAllResultsButton && outings.length"
      >
        <span v-translate>show all</span>&nbsp;<span class="badge">{{ totalOutings }}</span>
      </router-link>
      <add-link v-if="showAddOutingButton" document-type="outing" :query="addOutingQuery" class="button is-primary">
        <span v-translate v-if="outings.length === 0">Add the first outing</span>
      </add-link>
    </div>
  </div>
</template>

<script>
import { add_search_queries } from '@/js/add-search-query';
import { requireDocumentProperty } from '@/js/properties-mixins';
import viewModeMixin from '@/js/view-mode-mixin';

export default {
  mixins: [requireDocumentProperty, viewModeMixin],

  props: {
    hideSeeAllResultsButton: {
      type: Boolean,
      default: false,
    },
    includeEmptyOutings: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    outings() {
      let outings = this.document.associations.recent_outings?.documents || this.document.associations.outings;
      let query = this.allOutingsQuery;
      add_search_queries(query, outings);
      if (this.includeEmptyOutings) {
        return outings;
      } else {
        return outings.filter((outing) => outing.quality !== 'empty');
      }
    },

    totalOutings() {
      return this.document.associations.recent_outings?.total || this.outings.length;
    },

    addOutingQuery() {
      const query = {};

      if (this.documentType === 'waypoint') {
        const bbox = this.$documentUtils.getDocumentsBbox(this.document.associations.all_routes.documents);
        query.initial_bbox = bbox?.join(',');
      } else if (this.documentType === 'route') {
        query[this.document.type] = this.document.document_id;
      }

      return query;
    },

    allOutingsQuery() {
      const query = {};
      query[this.document.type] = this.document.document_id;
      return query;
    },

    showAddOutingButton() {
      // if the document is a route, we can add an outing directly linked to the route
      if (this.documentType === 'route') {
        return true;
      }

      // if the document is a waypoint, and if it has associated route, then the outing form
      // will propose routes in the extent of the waypoint (see initial_bbox query above)
      if (this.documentType === 'waypoint' && this.document.associations.all_routes.total !== 0) {
        return true;
      }

      return false;
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
