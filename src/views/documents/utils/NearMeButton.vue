<template>
  <!-- the documents around the user, without opening the map: the bbox of the query, for a radius -->
  <dropdown-button ref="menu" :disabled="busy">
    <template #button>
      <span
        class="button is-small"
        :class="{ 'is-primary': radius }"
        :title="$gettext('Search near me')"
        :aria-label="$gettext('Search near me')"
      >
        <fa-icon :icon="busy ? 'spinner' : 'location-crosshairs'" :spin="busy" />
        <span v-if="radius">&nbsp;{{ radius }} km</span>
        <span v-else-if="!$screen.isMobile">&nbsp;{{ $gettext('Near me') }}</span>
      </span>
    </template>
    <p class="dropdown-item is-size-7 has-text-grey">{{ $gettext('Radius around your position:') }}</p>
    <a
      v-for="km of RADIUS_KM"
      :key="km"
      class="dropdown-item"
      :class="{ 'is-active': radius === km }"
      @click="searchAround(km)"
    >
      {{ km }} km
    </a>
    <template v-if="radius">
      <hr class="dropdown-divider" />
      <a class="dropdown-item" @click="clear">{{ $gettext('Remove the filter') }}</a>
    </template>
  </dropdown-button>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { bboxAround } from '@/js/geo-bbox';
import { getPosition } from '@/js/geolocation';
import { notify } from '@/js/toast';

const RADIUS_KM = [10, 25, 50, 100];

const { $gettext } = useGlobalProperties();
const route = useRoute();
const router = useRouter();
const menu = useTemplateRef<{ isActive: boolean }>('menu');
const busy = ref(false);

// the radius of the filter in place (nmr: near me radius), when its bbox is still the one it set
const radius = computed(() => (route.query.bbox && Number(route.query.nmr)) || null);

async function searchAround(km: number) {
  menu.value!.isActive = false;
  busy.value = true;
  try {
    const { longitude, latitude } = await getPosition($gettext);
    await router.push({
      query: { ...route.query, bbox: bboxAround(longitude, latitude, km), nmr: km, offset: undefined },
    });
  } catch (error) {
    notify((error as Error).message, 'is-warning');
  } finally {
    busy.value = false;
  }
}

function clear() {
  menu.value!.isActive = false;
  const query = { ...route.query };
  delete query.bbox;
  delete query.nmr;
  void router.push({ query });
}
</script>
