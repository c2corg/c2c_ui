<template>
  <router-link
    :to="{
      name: documentType + '-diff',
      params: { id: id, versionFrom: versionFrom || 'prev', versionTo: versionTo || 'next', lang: lang },
    }"
  >
    <slot>diff</slot>
  </router-link>
</template>

<script>
import { requireDocumentTypeProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentTypeProperty],

  props: {
    lang: {
      type: String,
      required: true,
    },
    id: {
      type: Number,
      required: true,
    },
    versionFrom: {
      type: [Number, String],
      required: true,
    },
    versionTo: {
      type: [Number, String],
      required: true,
    },
  },
};
</script>
