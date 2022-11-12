<template>
  <document-link :document="route" class="pretty-route-link has-hover-background">
    <pretty-route
      :route="route"
      :hide-activities="hideActivities"
      :hide-area="hideArea"
      :hide-orientation="hideOrientation"
      :hide-height-difficulties="hideHeightDiffDifficulties"
    />
  </document-link>
</template>

<script>
export default {
  props: {
    route: {
      type: Object,
      required: true,
    },
    hideActivities: {
      type: Boolean,
      default: false,
    },
    hideArea: {
      type: Boolean,
      default: false,
    },
    hideOrientation: {
      type: Boolean,
      default: false,
    },
    hideHeightDiffDifficulties: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    rangeAreas() {
      return this.route.areas.filter((area) => area.area_type === 'range');
    },
  },
};
</script>

<style scoped lang="scss">
.pretty-route-link {
  display: block;
}

@media print {
  .is-size-4 {
    font-size: 1rem !important;
  }
}
</style>
