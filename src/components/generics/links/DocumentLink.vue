<template>
  <router-link
    :to="{ name: documentType, params: { id: document.document_id, lang: lang } }"
    :target="target"
    :title="$documentUtils.getDocumentTitle(document, $route.params.lang)"
  >
    <slot>
      <document-title :document="document" :uppercase-first-letter="uppercaseFirstLetter" />
    </slot>
  </router-link>
</template>

<script>
import { documentProperty, useDocumentType } from '@/js/properties';

export default {
  props: {
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
  },

  setup(props) {
    return useDocumentType(props);
  },
};
</script>
