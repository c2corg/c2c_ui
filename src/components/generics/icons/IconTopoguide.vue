<template>
  <fa-icon icon="compass" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
defineProps({
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
