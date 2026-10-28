<template>
  <ul class="featureslist">
    <li
      v-for="(feature, i) of features"
      :key="i"
      class="featureslist-item tag"
      @mouseenter="showFeature(feature, i)"
      @mouseleave="hideFeature(feature, i)"
    >
      <span>{{ nbPointsOnFeature(feature) }} points</span>
      <button class="delete is-small" @click="removeFeature(feature)">x</button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type Feature from 'ol/Feature';
import type LineString from 'ol/geom/LineString';
import type { PropType } from 'vue';

import yetixEvents from '@/components/yeti/yetix-events';

defineProps({
  features: {
    type: Array as PropType<Feature<LineString>[]>,
    required: true,
  },
});

function removeFeature(feature: Feature<LineString>) {
  yetixEvents.emit('removeFeature', feature);
}

function showFeature(feature: Feature<LineString>, index: number) {
  feature.setStyle(feature.get('highlightedStyle'));
  yetixEvents.emit('showFeature', index);
}

function hideFeature(feature: Feature<LineString>, index: number) {
  feature.setStyle(feature.get('normalStyle'));
  yetixEvents.emit('hideFeature', index);
}

function nbPointsOnFeature(feature: Feature<LineString>) {
  return feature.getGeometry()!.getCoordinates().length;
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.featureslist {
  margin: 0 -0.5rem;

  &-item {
    margin: 0.25rem;
    font-size: 0.7em;

    &:hover,
    &:focus {
      background: $grey-lighter;
      cursor: default;
    }
  }
}
</style>
