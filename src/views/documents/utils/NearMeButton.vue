<template>
  <!-- the documents around the user, without opening the map: the bbox of the query, for a radius -->
  <dropdown-button ref="menu" class="is-right" :disabled="busy">
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
import { toast } from '@/js/toast';

const RADIUS_KM = [10, 25, 50, 100];

const { $gettext } = useGlobalProperties();
const route = useRoute();
const router = useRouter();
const menu = useTemplateRef<{ isActive: boolean }>('menu');
const busy = ref(false);

// the radius of the filter in place (nmr: near me radius), when its bbox is still the one it set
const radius = computed(() => (route.query.bbox && Number(route.query.nmr)) || null);

function positionError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return $gettext('Location refused. Allow it in the settings of the browser, then try again.');
    case error.POSITION_UNAVAILABLE:
      return $gettext('Position unavailable (weak GPS signal?). Try again outside, or in a few seconds.');
    default:
      return $gettext('The position took too long to come. Try again.');
  }
}

async function searchAround(km: number) {
  menu.value!.isActive = false;
  busy.value = true;
  try {
    const { coords } = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      })
    );
    await router.push({
      query: { ...route.query, bbox: bboxAround(coords.longitude, coords.latitude, km), nmr: km, offset: undefined },
    });
  } catch (error) {
    toast({
      message: positionError(error as GeolocationPositionError),
      type: 'is-warning',
      position: 'bottom-center',
      duration: 5000,
    });
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
