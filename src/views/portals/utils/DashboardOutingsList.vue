<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link
        :to="{
          name: 'outings',
          query: {
            qa: 'draft,great',
            offset: 0,
            limit: 100,
          },
        }"
      >
        <icon-outing />
        {{ $filters.uppercaseFirstLetter($gettext('outings')) }}
      </router-link>
    </h4>
    <loading-notification :promise="outingsPromise" />
    <div v-if="outingsByDate">
      <div v-for="(sortedOutings, date) of outingsByDate" :key="date">
        <p class="outing-date-header is-4 is-italic has-text-weight-bold">
          <router-link :to="{ name: 'outings', query: { date: `${date},${date}` } }">
            {{ $filters.uppercaseFirstLetter($dateUtils.toLocalizedString(date, '@1')) }}
          </router-link>
        </p>
        <div class="dashboard-list">
          <dashboard-outing-link v-for="outing of sortedOutings" :key="outing.document_id" :outing="outing" />
        </div>
      </div>
    </div>
    <hr />
    <h6 class="title is-6 has-text-centered">
      <router-link
        :to="{
          name: 'outings',
          query: {
            qa: 'draft,great',
            bbox: '-431698,3115462,1931123,8442818',
            offset: 0,
            limit: 100,
          },
        }"
      >
        <span v-translate>See more</span>
      </router-link>
    </h6>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import DashboardOutingLink from './DashboardOutingLink.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Query = Record<string, string | undefined>;

const props = defineProps({
  isPersonal: {
    type: Boolean,
    required: true,
  },
});

const { $user } = useGlobalProperties();

// the user preferences while they load, then the outings
const outingsPromise = ref<ApiData | Promise<void> | null>(null);

const outings = computed(() => (outingsPromise.value as ApiData | null)?.data);

const outingsByDate = computed(() => {
  if (!outings.value) {
    return null;
  }

  const result: Record<string, C2cDocument[]> = {};

  for (const outing of outings.value.documents as C2cDocument[]) {
    if (outing.quality !== 'empty') {
      result[outing.date_end] = result[outing.date_end] ?? [];
      result[outing.date_end].push(outing);
    }
  }

  return result;
});

function loadOutings() {
  if (!props.isPersonal || !$user.isLogged) {
    loadOutingsWithQuery();
  } else {
    outingsPromise.value = getQueryFromUserPreferences('outing').then(loadOutingsWithQuery);
  }
}

function loadOutingsWithQuery(query: Query = {}) {
  outingsPromise.value = (c2c.outing as DocumentService).getAll({
    ...query,
    limit: 40,
    qa: 'draft,great',
  });
}

function getQueryFromUserPreferences(documentType: string) {
  return new Promise<Query>(function (resolve) {
    c2c.userProfile.preferences.get().then((result) => {
      const preferences = result.data;
      const query: Query = {};

      if (['outing', 'route', 'image', 'xreport', 'books', 'articles'].includes(documentType)) {
        const activities = preferences.activities.join(',');
        query.act = activities === '' ? undefined : activities;
      }

      if (['outing', 'route', 'image', 'xreport', 'waypoint'].includes(documentType)) {
        const areas = preferences.areas.map((area: C2cDocument) => area.document_id).join(',');
        query.a = areas === '' ? undefined : areas;
        query.bbox = undefined;
      }

      resolve(query);
    });
  });
}

watch(
  () => props.isPersonal,
  () => loadOutings()
);

// created
loadOutings();
</script>

<style scoped lang="scss">
.outing-date-header {
  margin-top: $size-6;
  margin-bottom: $size-7;
  border-bottom: solid $color-base-c2c 2px;
}

h4 > a,
h6 > a,
.outing-date-header > a,
li > a {
  color: $color-text !important;
}

h4 > a:hover,
h6 > a:hover,
.outing-date-header > a:hover {
  color: $color-link !important;
}

.dashboard-list > a:nth-child(2n + 1) {
  background-color: $body-background-color;
}
</style>
