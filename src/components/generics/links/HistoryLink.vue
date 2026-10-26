<template>
  <router-link
    :to="{ name: documentType + '-history', params: { id: document.document_id, lang: lang } }"
    rel="nofollow"
  >
    <slot> hist </slot>
  </router-link>
</template>

<script>
import { documentProperty, useDocumentType } from '@/js/properties';

export default {
  props: {
    ...documentProperty,
    lang: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    return useDocumentType(props);
  },
};
</script>
