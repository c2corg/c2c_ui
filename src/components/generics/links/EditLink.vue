<template>
  <router-link
    :to="{ name: documentType + '-edit', params: { id: document.document_id, lang: lang } }"
    @click="$emit('click')"
    rel="nofollow"
  >
    <slot>
      <span v-translate>Edit</span>
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
      required: true,
    },
  },

  emits: ['click'],

  setup(props) {
    return useDocumentType(props);
  },
};
</script>
