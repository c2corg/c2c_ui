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

<script>
import yetixEvents from '@/components/yeti/yetix-events';

export default {
  props: {
    features: {
      type: Array,
      required: true,
    },
  },
  methods: {
    removeFeature(feature) {
      yetixEvents.emit('removeFeature', feature);
    },
    showFeature(feature, index) {
      feature.setStyle(feature.get('highlightedStyle'));
      yetixEvents.emit('showFeature', index);
    },
    hideFeature(feature, index) {
      feature.setStyle(feature.get('normalStyle'));
      yetixEvents.emit('hideFeature', index);
    },
    nbPointsOnFeature(feature) {
      return feature.getGeometry().getCoordinates().length;
    },
  },
};
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
