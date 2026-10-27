<template>
  <fa-icon icon="bus" :fixed-width="fixedWidth" name="IconItinevert" />
</template>

<script setup lang="ts">
defineProps({
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
