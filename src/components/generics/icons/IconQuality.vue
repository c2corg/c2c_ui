<template>
  <fa-icon :icon="['quality', quality]" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
defineProps({
  quality: {
    type: String,
    required: true,
  },
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
