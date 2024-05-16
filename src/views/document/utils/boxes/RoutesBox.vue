<template>
  <div class="box no-print" v-if="source.length || !hideButtons">
    <h2 class="title is-2">
      <span>{{ $gettext('Associated routes') }}</span>
    </h2>
    <div v-if="disableActivitySplit">
      <div v-for="route of source" :key="route.document_id">
        <pretty-route-link :route="route" hide-area />
      </div>
    </div>
    <template v-else>
      <div v-for="activity of Object.keys(routes)" :key="activity">
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
      <router-link :to="{ name: 'routes', query: query }" class="button is-primary" v-if="source.length">
        <span v-translate>Filter results</span>&nbsp;<span class="badge">{{ totalRoutes }}</span>
      </router-link>
      <add-link document-type="route" :query="query" class="button is-primary" />
      <print-button
        class="button is-primary"
        forced-document-type="route"
        :forced-query="query"
        :forced-route-name="'routes/print'"
      />
    </div>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';
import PrintButton from '@/views/documents/utils/PrintButton';

export default {
  components: { PrintButton },
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
      let routes = (this.document.associations.routes || this.document.associations.all_routes.documents)
        .map((route) => ({ ...route, title: this.$documentUtils.getDocumentTitle(route, this.$route.params.lang) }))
        .sort((r1, r2) => r1.title.localeCompare(r2.title));
      if (this.document.type === 'w' && this.document?.waypoint_type !== 'climbing_outdoor') {
        // filter out crags for non climbing sites waypoints
        routes = routes.filter((route) => route?.climbing_outdoor_type !== 'single');
      }
      return routes;
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
      return this.document.associations.all_routes?.total || this.document.associations.routes?.length;
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
