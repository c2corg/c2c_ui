<template>
  <span v-if="text" class="is-ellipsed">
    <icon-area class="card-icon" />
    {{ text }}
  </span>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  computed: {
    text() {
      return this.$documentUtils.getSortedAreaList(this.document);
    },
  },
};
</script>
