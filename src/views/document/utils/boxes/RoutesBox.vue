<template>
  <div class="box no-print" v-if="displayedRoutes.length || !hideButtons">
    <h2 class="title is-2">
      <span>{{ $gettext('Associated routes') }}</span>
    </h2>
    <div v-if="disableActivitySplit">
      <div v-for="route of source" :key="route.document_id">
        <pretty-route-link :route="route" hide-area />
      </div>
    </div>
    <template v-else>
      <div v-for="activity of activities" :key="activity">
        <accordion-item>
          <h3 slot="title" class="title is-3">
            <icon-activity :activity="activity" />
            {{ $gettext(activity, 'activities') | uppercaseFirstLetter }}
          </h3>
          <div slot="content" v-for="(route, i) of routes[activity]" :key="i">
            <pretty-route-link :route="route" hide-activities hide-area />
          </div>
        </accordion-item>
      </div>
    </template>
    <div v-if="!hideButtons" class="has-text-centered add-section">
      <router-link :to="{ name: 'routes', query: query }" class="button is-primary" v-if="displayedRoutes.length">
        <span v-translate>Filter results</span>&nbsp;<span class="badge">{{ totalRoutes }}</span>
      </router-link>
      <add-link document-type="route" :query="query" class="button is-primary" />
    </div>
  </div>
</template>

<script>
import { add_search_queries } from '@/js/add-search-query';
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

    associatedRoutes() {
      return (this.document.associations.routes || this.document.associations.all_routes.documents).map((route) => ({
        ...route,
        title: this.$documentUtils.getDocumentTitle(route, this.$route.params.lang),
      }));
    },

    displayedRoutes() {
      return this.sortAndFilter([...this.associatedRoutes]);
    },

    source() {
      const routes = this.associatedRoutes.map((route) => ({ ...route }));
      add_search_queries(this.query, routes);
      return this.sortAndFilter(routes);
    },

    activities() {
      const activities = [];
      for (const route of this.displayedRoutes) {
        for (const activity of route.activities) {
          if (!activities.includes(activity)) {
            activities.push(activity);
          }
        }
      }
      return activities;
    },

    routes() {
      const result = {};
      for (const activity of this.activities) {
        const routes = this.associatedRoutes
          .filter((route) => route.activities.includes(activity))
          .map((route) => ({ ...route }));
        // A single route may have multiple activities associated, so a link to it will appear several times.
        // Each link should however have a different associated search (filtering by activity).
        // Since "associated search" is given as a document properties, the two links need to have different documents.
        // Hence the copying above.
        add_search_queries({ ...this.query, act: activity }, routes);
        result[activity] = this.sortAndFilter(routes);
      }
      return result;
    },

    totalRoutes() {
      return this.document.associations.all_routes?.total || this.document.associations.routes?.length;
    },
  },

  methods: {
    sortAndFilter(routes) {
      routes.sort((r1, r2) => r1.title.localeCompare(r2.title));
      if (this.document.type === 'w' && this.document?.waypoint_type !== 'climbing_outdoor') {
        // filter out crags for non climbing sites waypoints
        routes = routes.filter((route) => route?.climbing_outdoor_type !== 'single');
      }
      return routes;
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
