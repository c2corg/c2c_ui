<template>
  <document-link :document="image" class="has-hover-background" target="_blank">
    <figure class="image is-96x96 association-image-link-child">
      <thumbnail :img="image" size="SI" :title="image.locales[0].title" :alt="image.locales[0].title" loading="lazy" />
    </figure>
    <span class="association-image-link-child">
      {{ image.locales[0].title | max50chars }}
    </span>
  </document-link>
</template>

<script>
export default {
  filters: {
    max50chars: (value) => (value && value.length > 50 ? value.substring(0, 50) + '…' : value),
  },

  props: {
    image: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.association-image-link-child {
  display: table-cell;
  vertical-align: middle;
}

.association-image-link-child:last-child {
  padding-left: 10px;
}
</style>
