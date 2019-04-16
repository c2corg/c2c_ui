<template>

  <document-link :document="image" class="has-hover-background">
    <figure class="image is-96x96 association-image-link-child">
      <img :src="getUrl(image)" :title="image.locales[0].title">
    </figure>
    <document-title :document="image" class="association-image-link-child"/>
  </document-link>

</template>

<script>
  import imageUrls from '@/js/image-urls';

  export default {
    props: {
      image: {
        type: Object,
        required: true
      }
    },

    methods: {
      getUrl(image) {
        return imageUrls.getSquared(image);
      }
    }
  };
</script>

<style scoped lang="scss">

    .association-image-link-child{
        display:table-cell;
        vertical-align: middle;
    }

    .association-image-link-child:last-child{
        padding-left: 10px;
    }
</style>
