<template>
  <button
    v-if="$user.isLogged && display === 'button'"
    class="button is-small is-primary header-item"
    :class="{ 'is-loading': promise.loading }"
    @click="loadPreferences"
  >
    <fa-icon icon="star" />
    <span>&nbsp;</span>
    <span v-translate>Load my preferences</span>
  </button>
  <span
    v-else-if="$user.isLogged && display === 'dropdown'"
    class="dropdown-item"
    :class="{ 'is-loading': promise.loading }"
    @click="loadPreferences"
  >
    <fa-icon icon="star" />
    <span v-translate>Load my preferences</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

defineProps({
  display: {
    type: String,
    default: 'button',
  },
});

const route = useRoute();
const router = useRouter();

const promise = ref<ApiData | { loading?: boolean }>({});

const documentType = computed(() => String(route.name).slice(0, -1));

function loadPreferences() {
  promise.value = c2c.userProfile.preferences.get().then((result) => {
    const preferences = result.data as { activities: string[]; areas: C2cDocument[] };
    // undefined removes a parameter from the url
    const query: Record<string, unknown> = Object.assign({}, route.query);

    if (['outing', 'route', 'image', 'xreport', 'books', 'articles'].includes(documentType.value)) {
      const activities = preferences.activities.join(',');
      query.act = activities === '' ? undefined : activities;
    }

    if (['outing', 'route', 'image', 'xreport', 'waypoint'].includes(documentType.value)) {
      const areas = preferences.areas.map((area) => area.document_id).join(',');
      query.a = areas === '' ? undefined : areas;
      query.bbox = undefined;
    }

    router.push({ query: query as typeof route.query });
  });
}
</script>
