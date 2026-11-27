<template>
  <router-link
    :to="{ name: documentType + '-history', params: { id: document.document_id, lang: lang } }"
    rel="nofollow"
  >
    <slot> hist </slot>
  </router-link>
</template>

<script setup lang="ts">
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  lang: {
    type: String,
    required: true,
  },
});

const { documentType } = useDocumentType(props);
</script>
