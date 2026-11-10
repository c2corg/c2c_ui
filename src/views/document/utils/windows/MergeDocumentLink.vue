<template>
  <span>
    <document-title :document="document" />
    (<document-link :document="document" target="_blank"> {{ document.document_id }} </document-link>)
  </span>
</template>

<script setup lang="ts">
defineProps({
  document: {
    type: Object,
    required: true,
  },
});
</script>
