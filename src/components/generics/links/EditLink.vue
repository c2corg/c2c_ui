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

<script setup lang="ts">
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  lang: {
    type: String,
    required: true,
  },
});
defineEmits(['click']);

const { documentType } = useDocumentType(props);
</script>
