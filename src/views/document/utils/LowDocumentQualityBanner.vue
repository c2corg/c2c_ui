<template>
  <div v-if="lowQuality" class="notification is-info no-print">
    <span v-translate translate-context="low_quality_doc"> This document is a draft. Feel free to </span>
    <edit-link show-always :document="document" :lang="lang">
      <span v-translate translate-context="low_quality_doc"> edit </span>
    </edit-link>
    <span v-translate translate-context="low_quality_doc"> it, provide information and improve its quality. </span>
    <br />
    <span v-translate translate-context="low_quality_doc">
      Please follow the contribution rules and respect copyright.
    </span>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  computed: {
    lang() {
      return this.document ? this.document.cooked.lang : null;
    },

    lowQuality() {
      return ['empty', 'draft'].includes(this.document.quality);
    },
  },
};
</script>
