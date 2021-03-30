<template>
  <div class="box no-print" v-if="source.length != 0 || !hideButtons">
    <h2 class="title is-2">
      <span>{{ $gettext('Associated routes') }}</span>
    </h2>
    <div v-if="disableActivitySplit">
      <div v-for="route of source" :key="route.document_id">
        <pretty-route-link :route="route" hide-area />
      </div>
    </div>
    <div v-else v-for="activity of Object.keys(routes)" :key="activity">
      <h3 class="title is-3">
        <icon-activity :activity="activity" />
        {{ $gettext(activity, 'activities') | uppercaseFirstLetter }}
      </h3>
      <div v-for="(route, i) of routes[activity]" :key="i">
        <pretty-route-link :route="route" hide-activities hide-area />
      </div>
    </div>
    <div v-if="!hideButtons" class="has-text-centered add-section">
      <router-link :to="{ name: 'routes', query: query }" class="button is-primary">
        <span v-translate>Filter results</span>&nbsp;<span class="badge">{{ totalRoutes }}</span>
      </router-link>
      <add-link document-type="route" :query="query" class="button is-primary" />
    </div>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  props: {
    hideButtons: {
      type: Boolean,
      default: false,
    },

    disableActivitySplit: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    query() {
      const query = {};
      query[this.document.type] = this.document.document_id;
      return query;
    },

    source() {
      return (this.document.associations.routes || this.document.associations.all_routes.documents)
        .map((route) => ({ ...route, title: this.$documentUtils.getDocumentTitle(route, this.$route.params.lang) }))
        .sort((r1, r2) => r1.title.localeCompare(r2.title));
    },

    routes() {
      const result = {};

      for (const route of this.source) {
        for (const activity of route.activities) {
          if (!result[activity]) {
            result[activity] = [];
          }

          result[activity].push(route);
        }
      }

      return result;
    },

    totalRoutes() {
      return this.document.associations.all_routes?.total || routes.length;
    },
  },
};
</script>

<style scoped lang="scss">
h3 {
  margin-top: 1.5rem !important;
  margin-bottom: 0.5rem !important;
}

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
