<template>
  <div class="section">
    <html-header :title="$gettext('Outings statistics')" />
    <h1 class="title is-3 header-section">
      <span v-translate>Outings statistics</span>
      <span v-if="loadingPercentage !== 1">{{ Math.round(loadingPercentage * 100) }}%</span>
    </h1>

    <div v-if="outings['']?.length">
      <query-items v-if="$user.isModerator" class="filter-section" />

      <div class="tabs">
        <ul>
          <li
            v-for="activity of Object.keys(outings)"
            :key="activity"
            :class="{ 'is-active': activeTab === activity }"
            @click="activeTab = activity"
          >
            <a>
              <span v-if="activity">{{ $gettext(activity, 'activities') }}</span>
              <span v-else v-translate>All</span>
              &nbsp;
              <span>({{ outings[activity].length }})</span>
            </a>
          </li>
        </ul>
      </div>

      <outings-stats-part v-if="outings[activeTab]" :outings="outings[activeTab]" :activity="activeTab" />
    </div>
    <div v-else-if="promise !== null">
      <span v-translate>Loading...</span>
    </div>
    <div v-else>
      <div>
        <span v-translate>No result found</span>
      </div>
      <div class="empty-screen-button">
        <add-link document-type="outing" class="button is-primary">
          <span v-translate>Add the first outing</span>
        </add-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import OutingsStatsPart from './OutingsStatsPart.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useNoRobots } from '@/js/composables/head';
import constants from '@/js/constants';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import QueryItems from '@/views/documents/utils/QueryItems.vue';

const LIST_MAX_LENGTH = 2000;

useNoRobots();

const route = useRoute();

// the download in progress, cancelled by a new search
const promise = shallowRef<(Promise<void> & { cancel(): void }) | null>(null);
// the outings, by activity ('' for all of them)
const outings = ref<Record<string, C2cDocument[]>>({});
const loadingPercentage = ref(0);
const activeTab = ref(''); // empty string means all

function load() {
  if (promise.value) {
    promise.value.cancel();
  }
  promise.value = (c2c.outing as DocumentService)
    .fullDownload(route.query as Record<string, string>, LIST_MAX_LENGTH, progress)
    .then((found) => compute(found as C2cDocument[])) as Promise<void> & { cancel(): void };
}

function progress(current: number, total: number) {
  if (!total) {
    // when there are no outings, we do show "all" of them
    loadingPercentage.value = 1;
  } else {
    loadingPercentage.value = current / Math.min(total, LIST_MAX_LENGTH);
  }
}

function compute(found: C2cDocument[]) {
  promise.value = null;
  const result: Record<string, C2cDocument[]> = { '': found };

  for (const activity of constants.activities) {
    const ofActivity = found.filter((outing) => outing.activities.includes(activity));

    if (ofActivity.length !== 0) {
      result[activity] = ofActivity;
    }
  }

  outings.value = result;
}

watch(() => route.fullPath, load, { immediate: true });
</script>

<style scoped lang="scss">
.filter-section {
  padding-bottom: 0.5rem;
  clear: both;
}
.empty-screen-button {
  padding-top: 1rem;
}
</style>
