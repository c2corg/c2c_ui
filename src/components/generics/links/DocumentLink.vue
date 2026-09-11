<template>
  <router-link
    :to="{ name: documentType, params: { id: document.document_id, lang: lang } }"
    :target="target"
    :title="$documentUtils.getDocumentTitle(document, $route.params.lang)"
  >
    <slot>
      <document-title :document="document" :uppercase="uppercase" />
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

    uppercase: {
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
