<template>
  <span>
    <span v-if="uppercase">{{ uppercaseFirstLetter(title) }}</span>
    <span v-else>{{ title }}</span>
  </span>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  props: {
    uppercase: {
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
