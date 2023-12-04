<template>
  <div v-if="documents" class="cards-container is-flex">
    <document-link
      v-for="document in documents.documents"
      :key="document.document_id"
      :document="document"
      :title="$documentUtils.getDocumentTitle(document)"
      :query="$route.query"
      class="card-image"
    >
      <thumbnail :img="document" size="MI" height="250" loading="lazy" />
    </document-link>
  </div>
</template>

<script>
export default {
  props: {
    documents: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.cards-container {
  flex-flow: wrap row;
  //margin:auto;

  .card-image {
    transition: 0.2s;
    margin-bottom: 5px;
    flex-grow: 1;

    img {
      height: 200px;
    }
  }
}
</style>
