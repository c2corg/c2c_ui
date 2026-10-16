<template>
  <router-link
    :to="{ name: documentType, params: { id: document.document_id, lang: lang }, query: document.search_query }"
    :target="target"
    :title="$documentUtils.getDocumentTitle(document, $route.params.lang)"
  >
    <slot>
      <document-title :document="document" :uppercase-first-letter="uppercaseFirstLetter" />
    </slot>
  </router-link>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  props: {
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
  },
};
</script>
