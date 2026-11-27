<template>
  <fa-icon :icon="['far', 'compass']" transform="grow-2" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
defineProps({
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
