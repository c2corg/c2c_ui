<template>
  <router-link
    :to="{ name: documentType, params: { id: document.document_id, lang: lang } }"
    :target="target"
    :title="$documentUtils.getDocumentTitle(document, $route.params.lang as string)"
  >
    <slot>
      <document-title :document="document" :uppercase-first-letter="uppercaseFirstLetter" />
    </slot>
  </router-link>
</template>

<script setup lang="ts">
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  lang: {
    type: String,
    default: null,
  },

  uppercaseFirstLetter: {
    type: Boolean,
    default: false,
  },

  target: {
    type: String,
    default: undefined,
  },
});

const { documentType } = useDocumentType(props);
</script>
