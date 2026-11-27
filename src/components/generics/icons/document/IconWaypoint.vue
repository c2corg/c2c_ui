<template>
  <fa-icon icon="map-marker-alt" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
defineProps({
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
