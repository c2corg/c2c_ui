<template>
  <component :is="'icon-' + documentType" :fixed-width="fixedWidth" />
</template>

<script>
import { documentTypeProperty } from '@/js/properties';

export default {
  props: {
    ...documentTypeProperty,
    fixedWidth: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
