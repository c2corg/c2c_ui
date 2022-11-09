<template>
  <span>
    <span v-for="document of documents" :key="document.document_id" class="tag is-primary is-medium">
      <span v-if="document.loading">
        {{ document.document_id }}
      </span>
      <document-title v-else :document="document" />
      <button @click="$emit('remove', document)" class="delete is-small" />
    </span>
  </span>
</template>

<script>
export default {
  props: {
    documents: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.tag:not(:last-child) {
  margin-right: 0.5rem;
}
</style>
