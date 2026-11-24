<template>
  <div class="section metaskirando">
    <html-header :title="$gettext('Metaskirando')" />
    <div class="box">
      <h1 class="title is-3">
        <fa-icon icon="mountain" />
        {{ $gettext('Metaskirando') }}
      </h1>
      <p class="subtitle is-6">{{ $gettext('Outings from other sites') }}</p>

      <div class="filters">
        <input-document v-model="areas" document-type="area" multiple @update:model-value="onFilter" />
        <input-activity v-model="activities" @update:model-value="onFilter" />
      </div>

      <div v-if="store.loading" class="loading has-text-centered" data-test="loading">
        <spinner-icon />
      </div>
      <div v-else-if="store.error" class="notification is-danger is-light" data-test="error">
        {{ $gettext('An error occurred, please try again') }}
      </div>
      <p v-else-if="store.items.length === 0" class="has-text-centered is-italic empty" data-test="empty">
        {{ $gettext('No outing for these filters') }}
      </p>
      <div v-else>
        <div v-for="(outings, date) of store.itemsByDate" :key="date" data-test="day">
          <p class="outing-date-header is-4 is-italic has-text-weight-bold" data-test="date">
            {{ $filters.uppercaseFirstLetter($dateUtils.toLocalizedString(date, '@1')) }}
          </p>
          <div class="dashboard-list">
            <partner-outing-row v-for="outing of outings" :key="outing.id" :outing="outing" />
          </div>
        </div>
      </div>

      <hr />
      <ul class="sources is-size-7" data-test="sources">
        <li v-for="source of store.sources" :key="source.source" :class="{ 'has-text-danger': !isHealthy(source) }">
          <strong>{{ source.site_name ?? source.source }}</strong>:
          <template v-if="isHealthy(source) && source.last_success_at">
            {{ $gettext('Last updated {time}').replace('{time}', $dateUtils.timeAgo(source.last_success_at)) }}
          </template>
          <template v-else>{{ $gettext('Source unavailable') }}</template>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import PartnerOutingRow from './PartnerOutingRow.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import type { PartnerSourceHealth } from '@/js/apis/partner-outings-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { usePartnerOutingsStore } from '@/stores/partner-outings';

const { $language } = useGlobalProperties();
const route = useRoute();
const router = useRouter();
const store = usePartnerOutingsStore();

// the selected areas as documents (the filter of the store keeps their ids), and the activities
const areas = ref<C2cDocument[]>([]);
const activities = ref<string[]>([]);

// a source that answered recently enough to be shown
const isHealthy = (source: PartnerSourceHealth) => ['ok', 'degraded'].includes(source.status);

function reload() {
  return store.load($language?.current);
}

// the areas of the query that the input does not hold yet; the id stands for the title of one that cannot be read
async function loadAreas() {
  const missing = store.filters.areas.filter((id) => !areas.value.some((area) => area.document_id === id));
  const loaded = await Promise.all(
    missing.map(async (id) => {
      try {
        return (await (c2c.area as DocumentService).get(id)).data as unknown as C2cDocument;
      } catch {
        return { document_id: id, type: 'a', locales: [{ lang: 'en', title: `#${id}` }] } as C2cDocument;
      }
    })
  );
  areas.value = [...areas.value.filter((area) => store.filters.areas.includes(area.document_id!)), ...loaded];
}

function syncFromRoute() {
  store.fromRouteQuery(route.query);
  activities.value = [...store.filters.activities];
  loadAreas();
  return reload();
}

// a filter changed: the query follows (a list can be shared), and the outings load again
function onFilter() {
  store.filters = {
    areas: areas.value.map((area) => area.document_id!),
    activities: [...activities.value],
  };
  router.replace({ query: store.toRouteQuery() });
  return reload();
}

// the back button, or a link: only when the query is not the one of the filters
watch(
  () => route.query,
  (query) => {
    const current = JSON.stringify(store.toRouteQuery());
    store.fromRouteQuery(query);
    if (JSON.stringify(store.toRouteQuery()) !== current) {
      syncFromRoute();
    }
  }
);

onMounted(syncFromRoute);
</script>

<style scoped>
.filters {
  margin-bottom: var(--c2c-size-6);
}

.outing-date-header {
  margin-top: var(--c2c-size-6);
  margin-bottom: var(--c2c-size-7);
  border-bottom: solid var(--c2c-color-base-c2c) 2px;
}

.empty,
.loading {
  margin: var(--c2c-size-6) 0;
}

.dashboard-list > :nth-child(2n + 1) {
  background-color: var(--c2c-body-background-color);
}

.sources > li {
  color: var(--c2c-grey-light);
}
</style>
