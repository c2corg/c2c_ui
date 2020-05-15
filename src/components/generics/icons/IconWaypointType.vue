<template>
  <fa-icon :icon="['waypoint', waypointType]" />
</template>

<script>
export default {
  props: {
    waypointType: {
      type: String,
      required: true,
    },
  },
};
</script>
