<template>
  <icon-layer
    :name="name"
    :color="color"
    :selector="layerSelector"
    ref="iconLayer"
    :custom-icon-src="iconSrc"
    :custom-icon-card-src="iconCardSrc"
    @layer="$emit('layer', $event)"
    @set-overlay="setOverlay"
    @unset-overlay="unsetOverlay"
    @add-features="onFeatures"
  >
    <span v-translate>Data-Avalanche</span>
    <template #overlay>
      <div class="data-avalanche-content">
        <p class="is-size-7 px-1 py-1">
          <span>
            <strong>{{ overlay.title }} ({{ differenceDays(overlay.date!) }} <span v-translate>days</span>)</strong>
          </span>
        </p>
        <p class="is-size-7 is-italic">
          <a :href="overlay.url" target="_blank">
            {{ overlay.localisation }}
            <fa-icon icon="external-link-alt" />
          </a>
        </p>
      </div>
      <p class="footer is-size-7 has-text-left px-3 py-1">
        <a href="https://data-avalanche.org" target="_blank">
          <strong>©data-avalanche.org</strong>
        </a>
      </p>
    </template>
  </icon-layer>
</template>

<script setup lang="ts">
import type Feature from 'ol/Feature';
import { computed, ref, watch } from 'vue';

import IconLayer from './IconLayer.vue';
import { useIconLayer } from './icon-layer';

import Yetix from '@/components/yeti/Yetix.vue';
import DataAvalancheLayerContent from '@/components/yeti/map-layers/DataAvalancheLayerContent.vue';
import DataAvalancheLayerContentTitle from '@/components/yeti/map-layers/DataAvalancheLayerContentTitle.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';

defineEmits(['layer']);

const { $dateUtils, $gettext } = useGlobalProperties();
const { getLayer, onMapClick, onMapLooseClick, onMapPointerMove, onMapLoosePointerMove } = useIconLayer();

const name = 'dataAvalanche';
const color = 'hsl(51, 100%, 45%)';
const colorWeeks = 'hsl(31, 100%, 45%)';
const colorSeason = 'hsl(51, 100%, 45%)';
const colorExpired = 'lightgray';
const overlay = ref<{ title?: string; url?: string; date?: string; localisation?: string }>({});
const daysValidWeeks = 5;
const daysValidSeason = 190;
let features: Feature[] = [];

const layerSelector = computed(() => {
  return {
    title: $gettext('Data-Avalanche'),
    image: 'data-avalanche.png',
    small: true,
    contentComponent: DataAvalancheLayerContent,
    contentTitleComponent: DataAvalancheLayerContentTitle,
  };
});

const dataAvalancheAll = computed(() => Yetix.dataAvalancheAll as boolean);

function setOverlay(feature: Feature) {
  overlay.value.url = feature.get('link');

  let fullTitle = feature.get('title');
  const [title, text] = fullTitle.split(':').map((part: string) => part.trim());
  overlay.value.title = title;
  overlay.value.localisation = text;

  overlay.value.date = feature.get('date');
}

function unsetOverlay() {
  overlay.value.title = undefined;
  overlay.value.url = undefined;
  overlay.value.date = undefined;
}

function dateValid(date: string, days: number) {
  const todayString = $dateUtils.toLocalizedString(new Date(), 'YYYY-MM-DD');
  return (new Date(todayString).getTime() - new Date(date).getTime()) / 1000 < 60 * 60 * 24 * days;
}

function differenceDays(date: string) {
  const todayString = $dateUtils.toLocalizedString(new Date(), 'YYYY-MM-DD');
  return Math.round((new Date(todayString).getTime() - new Date(date).getTime()) / 1000 / 60 / 60 / 24);
}

function onFeatures(newFeatures: Feature[]) {
  features = newFeatures;
  updateStyle();
}

function updateStyle() {
  // set style
  features.forEach((feature) => {
    let isDateValidWeeks = dateValid(feature.get('date'), daysValidWeeks);
    let isDateValidSeason = dateValid(feature.get('date'), daysValidSeason);
    let color = isDateValidWeeks ? colorWeeks : isDateValidSeason ? colorSeason : colorExpired;

    let style = new ol.style.Style({
      image: new ol.style.Icon({
        src: createIcon(color),
        // based on dataAvalancheAll, size is 0,0, so icons are not visible
        size: isDateValidSeason || dataAvalancheAll.value ? [26, 26] : [0, 0],
      }),
      zIndex: isDateValidSeason ? 1 : 0,
    });

    let hoveredStyle = style.clone();
    hoveredStyle.setZIndex(2);
    hoveredStyle.getImage()!.setScale(1.3);

    let selectedStyle = style.clone();

    feature.setStyle(style);
    feature.set('normalStyle', style);
    feature.set('hoveredStyle', hoveredStyle);
    feature.set('selectedStyle', selectedStyle);
  });
}

watch(dataAvalancheAll, () => {
  updateStyle();
});

// created
const createIcon = (color = 'gray') => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
    <path d="M10.402 4.742a3 3 0 0 1 5.196 0l7.804 13.516a3 3 0 0 1-2.598 4.5H5.196a3 3 0 0 1-2.598-4.5z" stroke="black" stroke-width="1.25" fill="${color}" />
    <path d="m11,7.5h4l-1,9l-2,0"/>
    <circle cx="13" cy="19" r="1.5"></circle>
    </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};
const iconSrc = createIcon(color);
const iconCardSrc = createIcon(color);

defineExpose({ getLayer, onMapClick, onMapLooseClick, onMapPointerMove, onMapLoosePointerMove });
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.footer {
  background: $grey-lighter;
  margin: 10px -5px -5px;
}
.data-avalanche-content {
  width: 150px;
}
</style>
