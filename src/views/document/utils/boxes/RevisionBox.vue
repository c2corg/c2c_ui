<template>
  <div class="has-text-centered"><span v-translate>Revision</span> n° {{ version }}</div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],
  computed: {
    version() {
      if (this.document.locales[0].version > this.document.version) {
        return this.document.locales[0].version;
      } else {
        return this.document.version;
      }
    },
  },
};
</script>
