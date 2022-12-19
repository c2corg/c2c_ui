<template>
  <div class="tags-container">
    <span v-for="document of documents" :key="document.document_id" class="tag is-primary is-medium">
      <span v-if="document.loading">
        {{ document.document_id }}
      </span>
      <document-title v-else :document="document" class="document-title" />
      <button @click="$emit('remove', document)" class="delete is-small" />
    </span>
  </div>
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
.tags-container {
  margin-right: -0.5rem;
  margin-bottom: -0.5rem;
}

.tag {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

@media screen and (max-width: $tablet) {
  .tag {
    max-width: 100%;
  }

  .document-title {
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
