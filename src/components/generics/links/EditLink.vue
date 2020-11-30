<template>
  <router-link
    v-if="$user.isLogged || showEvenIfNotLogged"
    :to="{ name: documentType + '-edit', params: { id: document.document_id, lang: lang } }"
    @click.native="$emit('click')"
  >
    <slot>
      <span v-translate>Edit</span>
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
      required: true,
    },
    showEvenIfNotLogged: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
