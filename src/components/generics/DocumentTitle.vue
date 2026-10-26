<template>
  <span>
    <span v-if="uppercaseFirstLetter">{{ $filters.uppercaseFirstLetter(title) }}</span>
    <span v-else>{{ title }}</span>
  </span>
</template>

<script>
import { documentProperty } from '@/js/properties';

export default {
  props: {
    ...documentProperty,
    uppercaseFirstLetter: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    title() {
      return this.$documentUtils.getDocumentTitle(this.document, this.$route.params.lang);
    },
  },
};
</script>
