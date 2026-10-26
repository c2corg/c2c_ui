<template>
  <router-link
    v-if="documentType != 'profile'"
    :to="{ name: documentType + '-version', params: { id: id, version: version, lang: lang } }"
    rel="nofollow"
  >
    <slot />
  </router-link>
  <span v-else>
    <slot />
  </span>
</template>

<script>
import { documentTypeProperty } from '@/js/properties';

export default {
  props: {
    ...documentTypeProperty,
    version: {
      type: Number,
      required: true,
    },
    lang: {
      type: String,
      required: true,
    },
    id: {
      type: Number,
      required: true,
    },
  },
};
</script>
