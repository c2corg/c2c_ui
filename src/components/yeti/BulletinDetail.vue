<template>
  <div class="yeti-subpanel bulletin-detail">
    <sub-panel-title><span v-translate>Avalanche bulletin</span></sub-panel-title>

    <div class="is-flex is-justify-content-space-between is-align-items-baseline">
      <p class="title is-5 mb-2">{{ selected.name }}</p>
      <button class="delete" :aria-label="$gettext('Close')" @click="close"></button>
    </div>

    <p v-if="loading" class="py-3">
      <fa-icon icon="spinner" spin />
      <span class="ml-2" v-translate>Loading the bulletin</span>
    </p>
    <p v-else-if="failed" class="py-3 has-text-danger" v-translate>The bulletin could not be loaded</p>
    <p v-else-if="!bulletin" class="py-3" v-translate>No avalanche bulletin right now</p>

    <template v-else>
      <p class="is-size-7 mb-3">
        <span><strong v-translate>Validity date:</strong> {{ formatDate(bulletin.validTime?.endTime) }}</span>
        <strong v-if="expired" class="is-block has-text-danger">
          <fa-icon icon="exclamation-circle" />
          <span v-translate>Validity date expired</span>
        </strong>
      </p>

      <p v-if="meteoFrance.headline" class="has-text-weight-bold mb-2">{{ meteoFrance.headline }}</p>
      <p v-if="bulletin.highlights" class="has-text-weight-bold mb-2 text">{{ plainText(bulletin.highlights) }}</p>

      <div class="is-flex is-justify-content-space-around is-align-items-center mb-2">
        <danger-level v-if="danger.low" :danger="danger" />
        <input-orientation v-if="aspects.length" disabled :model-value="aspects" />
      </div>
      <p v-if="aspects.length" class="is-size-7 has-text-centered mb-2" v-translate>Most dangerous aspects</p>
      <p v-if="meteoFrance.dangerComment" class="mb-2">{{ meteoFrance.dangerComment }}</p>

      <ul v-if="problems.length" class="mb-2">
        <li v-for="(problem, i) of problems" :key="i" class="problem">
          <div class="is-flex is-align-items-center">
            <span class="tag is-warning is-light">{{ problemName(problem.problemType) }}</span>
            <span class="is-size-7 ml-2">
              {{ elevationText(problem.elevation) }}
              <template v-if="problem.validTimePeriod === 'earlier'">({{ $gettext('morning') }})</template>
              <template v-if="problem.validTimePeriod === 'later'">({{ $gettext('afternoon') }})</template>
            </span>
            <input-orientation
              v-if="problem.aspects?.length"
              disabled
              :model-value="problem.aspects"
              class="problem-aspects ml-auto"
            />
          </div>
          <!-- SLF gives the same comment to the problems of a group -->
          <p v-if="problem.comment && problem.comment !== problems[i - 1]?.comment" class="text is-size-7 mt-1">
            {{ plainText(problem.comment) }}
          </p>
        </li>
      </ul>

      <dl class="mb-3">
        <template v-if="meteoFrance.naturalAvalanches">
          <dt v-translate>Natural avalanches</dt>
          <dd>{{ meteoFrance.naturalAvalanches }}</dd>
        </template>
        <template v-if="meteoFrance.triggeredAvalanches">
          <dt v-translate>Triggered avalanches</dt>
          <dd>{{ meteoFrance.triggeredAvalanches }}</dd>
        </template>
      </dl>

      <details v-if="bulletin.avalancheActivity" open>
        <summary v-translate>Snowpack stability</summary>
        <p v-if="bulletin.avalancheActivity.highlights" class="has-text-weight-bold">
          {{ plainText(bulletin.avalancheActivity.highlights) }}
        </p>
        <p class="text">{{ plainText(bulletin.avalancheActivity.comment) }}</p>
      </details>

      <details v-if="bulletin.snowpackStructure || snowCover">
        <summary v-translate>Snow quality and snow cover</summary>
        <p v-if="bulletin.snowpackStructure" class="text">{{ plainText(bulletin.snowpackStructure.comment) }}</p>
        <table v-if="snowCover?.levels?.length" class="table is-narrow is-size-7 mt-2">
          <thead>
            <tr>
              <th v-translate>Elevation</th>
              <th v-translate>North (cm)</th>
              <th v-translate>South (cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="level of snowCover.levels" :key="level.elevation">
              <td>{{ level.elevation }} m</td>
              <td>{{ level.north }}</td>
              <td>{{ level.south }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="snowCover?.limitNorth !== undefined" class="is-size-7">
          <span v-translate>Snow cover from:</span>
          {{ snowCover.limitNorth }} m <span v-translate>(north)</span>, {{ snowCover.limitSouth }} m
          <span v-translate>(south)</span>
        </p>
      </details>

      <details v-if="newSnowDays.length">
        <summary v-translate>Fresh snow</summary>
        <table class="table is-narrow is-size-7">
          <thead>
            <tr>
              <th></th>
              <th>
                <span v-translate>Fresh snow in 24 h (cm)</span>
                <span v-if="meteoFrance.newSnow?.elevation">&nbsp;– {{ meteoFrance.newSnow.elevation }} m</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day of newSnowDays" :key="day.date">
              <td>
                {{ formatDate(day.date, 'ddd DD/MM') }}
                <span v-if="isForecast(day.date)" class="has-text-grey" v-translate>(forecast)</span>
              </td>
              <td>{{ day.min === day.max ? day.min : `${day.min}–${day.max}` }}</td>
            </tr>
          </tbody>
        </table>
      </details>

      <details v-if="bulletin.weatherForecast || bulletin.weatherReview || forecasts.length">
        <summary v-translate>Weather</summary>
        <p v-if="bulletin.weatherForecast" class="text">{{ plainText(bulletin.weatherForecast.comment) }}</p>
        <p v-if="bulletin.weatherReview" class="text">
          <strong v-translate>Past days</strong><br />{{ plainText(bulletin.weatherReview.comment) }}
        </p>
        <div v-if="forecasts.length" class="table-container mt-2">
          <table class="table is-narrow is-size-7">
            <thead>
              <tr>
                <th></th>
                <th v-for="(elevation, i) of windElevations" :key="i">
                  <span v-translate>Wind</span> {{ elevation ? `${elevation} m` : '' }}
                </th>
                <th v-translate>0 °C isotherm</th>
                <th v-translate>Rain-snow limit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="forecast of forecasts" :key="forecast.time">
                <td>{{ formatDate(forecast.time, 'ddd HH:mm') }}</td>
                <td v-for="(wind, i) of forecast.wind" :key="i">
                  <template v-if="wind.speed !== undefined">{{ wind.direction }} {{ wind.speed }} km/h</template>
                </td>
                <td>{{ meters(forecast.freezingLevel) }}</td>
                <td>{{ meters(forecast.rainSnowLimit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details v-if="tendency" open>
        <summary>
          <span v-translate>Trend</span>
          <fa-icon v-if="tendencyIcon" :icon="tendencyIcon" class="ml-2" />
        </summary>
        <p v-if="tendency.highlights" class="has-text-weight-bold">{{ plainText(tendency.highlights) }}</p>
        <p v-if="tendency.comment" class="text">{{ plainText(tendency.comment) }}</p>
      </details>

      <p class="is-size-7 mt-3 bulletin-source">
        <strong>©{{ bulletin.source?.provider?.name }}</strong>
        <span v-if="bulletin.publicationTime">, {{ formatDate(bulletin.publicationTime) }}</span>
        <br />
        <a v-if="officialUrl" :href="officialUrl" target="_blank" rel="noopener">
          <fa-icon icon="external-link-alt" />
          <span class="ml-1" v-translate>Full bulletin</span>
        </a>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';

import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import { plainText, toDangerLevel } from '@/components/yeti/avalanche-bulletin';
import DangerLevel from '@/components/yeti/map-layers/DangerLevel.vue';
import type { SelectedBulletin } from '@/components/yeti/yetix-types';
import avalancheBulletins, { type AvalancheBulletin, type Elevation } from '@/js/apis/avalanche-bulletin-service';
import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  selected: {
    type: Object as PropType<SelectedBulletin>,
    required: true,
  },
});

const emit = defineEmits(['close']);

const { $dateUtils, $gettext, $language } = useGlobalProperties();

const bulletin = ref<AvalancheBulletin | null>(null);
const loading = ref(false);
const failed = ref(false);

const meteoFrance = computed(() => bulletin.value?.customData?.MeteoFrance ?? {});
const danger = computed(() => toDangerLevel(bulletin.value?.dangerRatings));
const aspects = computed(() => meteoFrance.value.avalancheProneLocation?.aspects ?? []);
const snowCover = computed(() => meteoFrance.value.snowCover);
const newSnowDays = computed(() => meteoFrance.value.newSnow?.days ?? []);
const windElevations = computed(() => meteoFrance.value.weather?.windElevations ?? []);
const forecasts = computed(() => meteoFrance.value.weather?.forecasts ?? []);
const tendency = computed(() => bulletin.value?.tendency?.[0]);
// the PDF of Météo-France, else the website of the service
const officialUrl = computed(() =>
  props.selected.regionId.startsWith('FR-')
    ? avalancheBulletins.pdfUrl(props.selected.regionId)
    : bulletin.value?.source?.provider?.website
);
const expired = computed(() => {
  const end = bulletin.value?.validTime?.endTime;
  return !!end && Date.now() > new Date(end).getTime();
});

const problemNames = computed<Record<string, string>>(() => ({
  new_snow: $gettext('New snow'),
  wind_slab: $gettext('Wind slab'),
  persistent_weak_layers: $gettext('Persistent weak layers'),
  wet_snow: $gettext('Wet snow'),
  gliding_snow: $gettext('Gliding snow'),
  cornices: $gettext('Cornices'),
  no_distinct_avalanche_problem: $gettext('No distinct avalanche problem'),
  favourable_situation: $gettext('Favourable situation'),
}));
const problems = computed(() => bulletin.value?.avalancheProblems ?? []);

function problemName(type: string) {
  return problemNames.value[type] ?? type;
}

// an elevation band of a problem: '2200' (m) or 'treeline'
function elevationText(elevation?: Elevation) {
  const bound = (value: string) => (value === 'treeline' ? $gettext('treeline') : `${value} m`);
  if (elevation?.lowerBound && elevation.upperBound) {
    return `${bound(elevation.lowerBound)} – ${bound(elevation.upperBound)}`;
  }
  if (elevation?.lowerBound) {
    return `${$gettext('above')} ${bound(elevation.lowerBound)}`;
  }
  if (elevation?.upperBound) {
    return `${$gettext('below')} ${bound(elevation.upperBound)}`;
  }
  return '';
}

const tendencyIcon = computed(() => {
  switch (tendency.value?.tendencyType) {
    case 'increasing':
      return 'arrow-up';
    case 'decreasing':
      return 'arrow-down';
    case 'steady':
      return 'arrow-right';
    default:
      return null;
  }
});

function formatDate(date?: string, format = 'DD/MM/YYYY HH:mm') {
  return date ? $dateUtils.toLocalizedString(new Date(date), format) : '';
}

function meters(value?: number) {
  return value === undefined ? '' : `${value} m`;
}

// the days after the publication are forecasts, the others observations
function isForecast(date: string) {
  const published = bulletin.value?.validTime?.startTime?.slice(0, 10);
  return !!published && date > published;
}

function close() {
  emit('close');
}

watch(
  () => [props.selected.regionId, $language.current] as const,
  async ([regionId, lang]) => {
    bulletin.value = null;
    failed.value = false;
    loading.value = true;
    try {
      const bulletins = await avalancheBulletins.getLatestBulletins(regionId, lang);
      // another massif may have been opened meanwhile
      if (regionId === props.selected.regionId) {
        bulletin.value = bulletins[0] ?? null;
      }
    } catch {
      if (regionId === props.selected.regionId) {
        failed.value = true;
      }
    } finally {
      if (regionId === props.selected.regionId) {
        loading.value = false;
      }
    }
  },
  { immediate: true }
);
</script>

<style scoped>
details {
  margin-top: 0.75rem;
  border-top: 1px solid var(--c2c-grey-lighter);
  padding-top: 0.5rem;
}

summary {
  cursor: pointer;
  font-weight: bold;
}

details > p,
details > table,
details > .table-container {
  margin-top: 0.5rem;
}

.text {
  white-space: pre-line;
}

dt {
  font-weight: bold;
}

dd + dt {
  margin-top: 0.5rem;
}

.problem + .problem {
  margin-top: 0.5rem;
}

.bulletin-detail :deep(.problem-aspects) {
  width: 40px;
  height: 40px;
}

.bulletin-source {
  border-top: 1px solid var(--c2c-grey-lighter);
  padding-top: 0.5rem;
}

.bulletin-detail :deep(.input-orientation) {
  width: 70px;
  height: 70px;
}
</style>
