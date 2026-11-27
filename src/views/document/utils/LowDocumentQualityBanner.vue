<template>
  <div class="notification is-info no-print">
    <span v-translate>This document is a draft.</span>
    <edit-link :document="document" :lang="lang">
      <span v-translate>Feel free to edit it.</span>
    </edit-link>
    <span v-translate>
      Provide information and improve its quality, following the contribution rules and respecting copyright.
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { cookedDocumentProperty } from '@/js/properties';

const props = defineProps({ ...cookedDocumentProperty });

const lang = computed(() => (props.document ? props.document.cooked.lang : null));
</script>
