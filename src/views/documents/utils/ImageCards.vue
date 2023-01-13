<template>
  <div v-if="documents" class="cards-container is-flex">
    <document-link
      v-for="doc in documents.documents"
      :key="doc.document_id"
      :document="doc"
      class="card-img"
      :class="{ 'show-delete-button': showDeleteButton }"
    >
      <div>
        <img :src="getMediumImageUrl(doc)" height="250" loading="lazy" :title="$documentUtils.getDocumentTitle(doc)" />
        <delete-button v-if="showDeleteButton" @click.prevent="clickDelete(doc)" class="delete-button" />
      </div>
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

    showDeleteButton: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    getMediumImageUrl: imageUrls.getMedium,

    clickDelete(document) {
      this.$emit('delete', document);
    },
  },
};
</script>

<style scoped lang="scss">
.cards-container {
  flex-flow: wrap row;
  //margin:auto;

  .card-img {
    transition: 0.2s;
    margin-bottom: 5px;
    margin-left: 5px;
    flex-grow: 1;

    &.show-delete-button {
      margin-left: 10px;
    }

    img {
      height: 200px;

      &:hover {
        filter: brightness(90%);
      }
    }

    & > div {
      position: relative;
      width: fit-content;
    }
  }
}

.delete-button {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  font-size: 2rem;
}
</style>
