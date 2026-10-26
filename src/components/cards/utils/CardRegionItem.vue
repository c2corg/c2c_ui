<template>
  <span v-if="text" class="is-ellipsed">
    <icon-area class="card-icon" />
    {{ text }}
  </span>
</template>

<script>
import { documentProperty } from '@/js/properties';

export default {
  props: { ...documentProperty },

  computed: {
    text() {
      return this.$documentUtils.getSortedAreaList(this.document);
    },
  },
};
</script>
