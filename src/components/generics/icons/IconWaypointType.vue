<template>
  <fa-icon :icon="['waypoint', waypointType]" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
defineProps({
  waypointType: {
    type: String,
    required: true,
  },
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
