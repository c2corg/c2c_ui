<template>
  <div
    v-if="enabled && !isDraftView && outings.length"
    class="box no-print partner-outings-box"
    data-test="partner-outings-box"
  >
    <div class="title is-2">{{ $gettext('Outings nearby on other sites') }}</div>
    <p class="is-size-7 has-text-grey mb-2" data-test="partner-outings-explanation">
      {{ explanation }}
    </p>
    <div class="dashboard-list">
      <partner-outing-row
        v-for="{ outing, distance } of outings"
        :key="outing.id"
        :outing="outing"
        :data-outing-id="outing.id"
      >
        <template #before-title>
          <span class="has-text-normal outing-date">{{ outing.date }}&hairsp;&bull;</span>
        </template>
        <span class="is-size-7 outing-distance" data-test="distance">{{ distanceLabel(distance) }}</span>
      </partner-outing-row>
    </div>
    <div class="has-text-centered mt-4">
      <router-link :to="allOutingsLink" class="button is-primary" data-test="partner-outings-all">
        {{ $gettext('Show all on Metaskirando') }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import partnerOutingsService from '@/js/apis/partner-outings-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useViewMode } from '@/js/composables/view-mode';
import config from '@/js/config';
import { documentProperty } from '@/js/properties';
import PartnerOutingRow from '@/views/portals/metaskirando/PartnerOutingRow.vue';
import {
  CLOSE_DAYS,
  CLOSE_RADIUS,
  HERE_DISTANCE,
  type CloseOuting,
  closeOutings,
  closeQuery,
  referencePoints,
} from '@/views/portals/metaskirando/close-partner-outings';

const props = defineProps({ ...documentProperty });

const { $gettext, $language } = useGlobalProperties();
const { isDraftView } = useViewMode();

// the outings of the other sites are not yet on camptocamp.org: the box shows where the /metaskirando entry of the
// main menu does (main-menu.ts)
const enabled = config.isBackendSelectable || config.urls.name !== 'prod';

const isRoute = computed(() => props.document.type === 'r');
const points = computed(() => referencePoints(props.document));
// a route lists the outings of its activities; a waypoint, all of them
const activities = computed(() => (isRoute.value ? (props.document.activities as string[] | undefined) : undefined));
const query = computed(() =>
  closeQuery(points.value, { activities: activities.value, lang: $language?.current as string | undefined })
);

const outings = ref<CloseOuting[]>([]);
let controller: AbortController | null = null;

// an API without the partner outings (404), or that fails: no box, the page is the same as before
async function load() {
  controller?.abort();
  outings.value = [];
  if (!enabled || isDraftView.value || !query.value) {
    return;
  }
  const current = (controller = new AbortController());
  try {
    const answer = await partnerOutingsService.getAll(query.value, current.signal);
    if (current === controller) {
      outings.value = closeOutings(answer.items ?? [], points.value);
    }
  } catch {
    if (current === controller) {
      outings.value = [];
    }
  }
}

watch(() => [isDraftView.value, JSON.stringify(query.value)], load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const kilometres = (metres: number) => (Math.round(metres / 100) / 10).toLocaleString($language?.current as string);

const explanation = computed(() =>
  $gettext('Reported on partner sites in the last {days} days, within {distance} km')
    .replace('{days}', String(CLOSE_DAYS))
    .replace('{distance}', kilometres(CLOSE_RADIUS))
);

function distanceLabel(distance: number) {
  if (distance <= HERE_DISTANCE) {
    return isRoute.value ? $gettext('On the route') : $gettext('Here');
  }
  return $gettext('{distance} km away').replace('{distance}', kilometres(distance));
}

// the same outings on /metaskirando, with its map
const allOutingsLink = computed(() => ({
  name: 'metaskirando',
  query: {
    bbox: query.value?.bbox?.join(','),
    act: activities.value?.length ? activities.value.join(',') : undefined,
  },
}));
</script>

<style scoped>
.outing-date {
  white-space: nowrap;
}

.outing-distance {
  color: var(--c2c-grey-light);
  white-space: nowrap;
}

.outing-distance:before {
  content: '\2022\00a0';
}
</style>
