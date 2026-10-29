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
          <template #title>
            <h3 class="title is-3">
              <icon-activity :activity="activity" />
              {{ $filters.uppercaseFirstLetter($gettext(activity, 'activities')) }}
            </h3>
          </template>
          <template #content>
            <div v-for="(route, i) of routes[activity]" :key="i">
              <pretty-route-link :route="route" hide-activities hide-area />
            </div>
          </template>
        </accordion-item>
      </div>
    </template>
    <div v-if="!hideButtons" class="has-text-centered add-section">
      <router-link :to="{ name: 'routes', query: query }" class="button is-primary" v-if="source.length">
        <span v-translate>Filter results</span>&nbsp;<span class="badge">{{ totalRoutes }}</span>
      </router-link>
      <add-link document-type="route" :query="query" class="button is-primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({
  ...documentProperty,
  hideButtons: {
    type: Boolean,
    default: false,
  },

  disableActivitySplit: {
    type: Boolean,
    default: false,
  },
});

const pageRoute = useRoute();
const { $documentUtils } = useGlobalProperties();

// the routes of a waypoint (all of them, as a page with its total), or the routes associated to a document
const associations = computed(
  () =>
    props.document.associations as {
      routes?: C2cDocument[];
      all_routes?: { documents: C2cDocument[]; total: number };
    }
);

const query = computed(() => ({ [props.document.type!]: props.document.document_id }));

const source = computed(() => {
  let routes = (associations.value.routes || associations.value.all_routes!.documents)
    .map((route): C2cDocument & { title: string } => ({
      ...route,
      title: $documentUtils.getDocumentTitle(route, pageRoute.params.lang as string),
    }))
    .sort((r1, r2) => r1.title.localeCompare(r2.title));
  if (props.document.type === 'w' && props.document?.waypoint_type !== 'climbing_outdoor') {
    // filter out crags for non climbing sites waypoints
    routes = routes.filter((route) => route?.climbing_outdoor_type !== 'single');
  }
  return routes;
});

const routes = computed(() => {
  const result: Record<string, C2cDocument[]> = {};

  for (const route of source.value) {
    for (const activity of route.activities as string[]) {
      if (!result[activity]) {
        result[activity] = [];
      }

      result[activity].push(route);
    }
  }

  return result;
});

const totalRoutes = computed(() => associations.value.all_routes?.total || associations.value.routes?.length);
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
