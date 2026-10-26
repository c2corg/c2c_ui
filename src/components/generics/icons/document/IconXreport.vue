<template>
  <fa-icon icon="flag-checkered" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
defineProps({
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
