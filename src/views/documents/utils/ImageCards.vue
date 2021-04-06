<template>
  <div v-if="documents" class="cards-container is-flex">
    <document-link
      v-for="document in documents.documents"
      :key="document.document_id"
      :document="document"
      :title="$documentUtils.getDocumentTitle(document)"
      class="card-image"
    >
      <img :src="getMediumImageUrl(document)" height="250" loading="lazy" />
    </document-link>
  </div>
</template>

<script>
import imageUrls from '@/js/image-urls';

export default {
  props: {
    documents: {
      type: Object,
      required: true,
    },
  },

  methods: {
    getMediumImageUrl: imageUrls.getMedium,
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
