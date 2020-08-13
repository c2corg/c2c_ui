<template>
  <ul class="FeaturesList">
    <li
      v-for="(feature, i) of features"
      :key="i"
      class="FeaturesList-Item tag"
      @mouseenter="showFeature(feature)"
      @mouseleave="hideFeature(feature)"
    >
      <span>{{ nbPointsOnFeature(feature) }} points</span>
      <button class="delete is-small" @click="removeFeature(feature)">x</button>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    map: {
      type: Object,
      default: null,
    },
    features: {
      type: Array,
      required: true,
    },
  },
  methods: {
    removeFeature(feature) {
      this.map.removeFeature(feature);
    },

    showFeature(feature) {
      feature.setStyle(feature.get('highlightedStyle'));
    },

    hideFeature(feature) {
      feature.setStyle(feature.get('normalStyle'));
    },
    nbPointsOnFeature(feature) {
      return feature.getGeometry().getCoordinates().length;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.FeaturesList {
  margin: 0 -0.5rem;
}
.FeaturesList-Item {
  margin: 0.25rem;
  font-size: 0.7em;
}
.FeaturesList-Item:hover,
.FeaturesList-Item:focus {
  background: $grey-lighter;
  cursor: default;
}
</style>
