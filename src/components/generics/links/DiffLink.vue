<template>
  <router-link
    :to="{
      name: documentType + '-diff',
      params: { id: id, versionFrom: versionFrom || 'prev', versionTo: versionTo || 'next', lang: lang },
    }"
    rel="nofollow"
  >
    <slot>diff</slot>
  </router-link>
</template>

<script>
import { documentTypeProperty } from '@/js/properties';

export default {
  props: {
    ...documentTypeProperty,
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
