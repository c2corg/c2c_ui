<template>
  <div v-if="documents" class="cards-container" :style="{ '--row-height': `${ROW_HEIGHT}px` }">
    <document-link
      v-for="document in documents.documents"
      :key="document.document_id"
      :document="document"
      :title="$documentUtils.getDocumentTitle(document)"
      class="card-image"
      :style="{ '--ratio': getRatio(document) }"
    >
      <thumbnail
        :img="document"
        size="MI"
        :sizes="`auto, ${Math.round(getRatio(document) * ROW_HEIGHT)}px`"
        loading="lazy"
      />
    </document-link>
  </div>
</template>

<script setup lang="ts">
defineProps({
  documents: {
    type: Object,
    required: true,
  },
});

// Justified rows: each image takes a width in proportion to its aspect ratio, so the images of a row share one height
// and the row fills the width, without holes. The height a row aims at; rows grow from it to fill the width.
const ROW_HEIGHT = 220;

// the aspect ratio of the original, from the image document; 4:3 when unknown
const getRatio = function (document: { width?: number | null; height?: number | null }): number {
  return document.width && document.height ? document.width / document.height : 4 / 3;
};
</script>

<style scoped>
.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;

  /* the last row keeps the row height, instead of stretching a few images over the whole width */
  &::after {
    content: '';
    flex-grow: 999;
  }

  .card-image {
    flex-grow: var(--ratio);
    flex-basis: calc(var(--ratio) * var(--row-height));
    aspect-ratio: var(--ratio);
    max-width: 100%;
    transition: 0.2s;

    /* the image covers its box: a row crops a few pixels of each image to fill the width */
    :deep(picture),
    :deep(img) {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}
</style>
