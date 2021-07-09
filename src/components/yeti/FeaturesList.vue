<template>
  <ul class="featureslist">
    <li
      v-for="(feature, i) of features"
      :key="i"
      class="featureslist-item tag"
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
  inject: ['$yetix'],
  props: {
    features: {
      type: Array,
      required: true,
    },
  },
  methods: {
    removeFeature(feature) {
      this.$yetix.$emit('removeFeature', feature);
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
