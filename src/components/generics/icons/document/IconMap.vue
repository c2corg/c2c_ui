<template>
  <fa-icon icon="map" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
defineProps({
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
