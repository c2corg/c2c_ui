<template>
  <component :is="'icon-' + documentType" :fixed-width="fixedWidth" />
</template>

<script>
import { requireDocumentTypeProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentTypeProperty],

  props: {
    fixedWidth: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
