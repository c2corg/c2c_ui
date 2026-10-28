<template>
  <div class="yeti-subpanel">
    <sub-panel-title><span v-translate>Meteo</span></sub-panel-title>
    <div v-if="hasLonLat" class="iframe-container p-1">
      <div :style="{ opacity: loading ? 0 : 1 }">
        <iframe
          :src="meteoBlueWidgetUrl"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
        <p>©meteoblue - <a :href="meteoBlueUrl" target="_blank" v-translate>More info on meteoblue.com</a></p>
      </div>
    </div>
    <div v-else>
      <p v-translate>Click on the map to get weather forecasts</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import yetixEvents from '@/components/yeti/yetix-events';
import { useGlobalProperties } from '@/js/composables/global-properties';

const { $language } = useGlobalProperties();

const loading = ref(false);
const lat = ref(0);
const lon = ref(0);

// available lang in meteoblue
const lang = computed(() => {
  const current = $language.current;
  return current && ['fr', 'it', 'de', 'en', 'es', 'hu'].includes(current) ? current : 'en';
});
const meteoBlueBaseUrl = computed(() => `https://www.meteoblue.com/${lang.value}/weather`);
const meteoBlueWidgetUrl = computed(
  () =>
    `${meteoBlueBaseUrl.value}/widget/daily/${lat.value}N${lon.value}E` +
    `?geoloc=fixed&days=5&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=1&maxtemperature=1&mintemperature=1&windspeed=1&windgust=0&winddirection=1&uv=0&humidity=0&precipitation=1&precipitationprobability=1&spot=0&pressure=0&layout=light`
);
const meteoBlueUrl = computed(() => `${meteoBlueBaseUrl.value}/week/${lat.value}N${lon.value}E`);
const hasLonLat = computed(() => lon.value !== 0 && lat.value !== 0);

function onLonLat(event: unknown) {
  const { lon: newLon, lat: newLat } = event as { lon: number; lat: number };
  loading.value = true;
  lon.value = newLon;
  lat.value = newLat;
  setTimeout(() => {
    loading.value = false;
  }, 350);
}

onMounted(() => {
  yetixEvents.on('lon-lat', onLonLat);
});

// it listened on after unmount
onBeforeUnmount(() => {
  yetixEvents.off('lon-lat', onLonLat);
});
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.iframe-container {
  background: $light;

  div {
    transition: opacity 0.35s;
  }
}
iframe {
  width: 100%;
  height: 310px;
}
</style>
