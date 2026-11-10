<template>
  <span>
    <fa-icon icon="gear" />
    <span>{{ layer.title }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps({
  layer: {
    type: Object,
    required: true,
  },
});
</script>
