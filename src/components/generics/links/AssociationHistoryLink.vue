<template>
  <component :is="disabled ? 'span' : 'router-link'" :to="{ name: 'associations-history', query: query }">
    <slot />
  </component>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    documentId: {
      type: Number,
      default: null,
    },
    userId: {
      type: Number,
      default: null,
    },
    limit: {
      type: Number,
      default: null,
    },
    offset: {
      type: Number,
      default: null,
    },
  },

  computed: {
    query() {
      const result = {};

      if (this.offset) {
        result.offset = this.offset;
      }

      if (this.limit) {
        result.limit = this.limit;
      }

      if (this.documentId) {
        result.d = this.documentId;
      }

      if (this.userId) {
        result.u = this.userId;
      }

      return result;
    },
  },
};
</script>
