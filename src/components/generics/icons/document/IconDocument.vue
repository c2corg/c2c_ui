<template>
  <component :is="'icon-' + documentType" :fixed-width="fixedWidth" />
</template>

<script setup lang="ts">
import { documentTypeProperty } from '@/js/properties';

defineProps({
  ...documentTypeProperty,
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>
