<template>
  <document-link :document="route" class="pretty-route-link has-hover-background">
    <pretty-route
      :route="route"
      :hide-activities="hideActivities"
      :hide-area="hideArea"
      :hide-orientation="hideOrientation"
      :hide-height-diff-difficulties="hideHeightDiffDifficulties"
    />
  </document-link>
</template>

<script setup lang="ts">
defineProps({
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
});
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
