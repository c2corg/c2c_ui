<template>
  <fa-icon :icon="['waypoint', waypointType]" :fixed-width="fixedWidth" />
</template>

<script>
export default {
  props: {
    waypointType: {
      type: String,
      required: true,
    },
    fixedWidth: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
