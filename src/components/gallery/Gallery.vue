<template>
  <swiper-container slides-per-view="auto" space-between="15" class="swiper">
    <swiper-slide style="height: 200px" v-for="image of images" :key="image.document_id">
      <thumbnail
        :img="image"
        size="MI"
        :alt="image.locales[0].title"
        :title="image.locales[0].title"
        @click="$imageViewer.show(image)"
        loading="lazy"
      />
    </swiper-slide>
  </swiper-container>
</template>

<script>
export default {
  // Vue 3 array watchers (compat made them deep: true); the deep option of each watcher applies
  compatConfig: { WATCH_ARRAY: false },

  props: {
    images: {
      type: Array,
      required: true,
    },
  },

  watch: {
    // deep 1: also when images are added to the array (uploads), as Vue 2 array watchers did
    images: {
      handler() {
        this.images.forEach(this.$imageViewer.push);
      },
      deep: 1,
    },
  },

  created() {
    this.images.forEach(this.$imageViewer.push);
  },
};
</script>

<style scoped lang="scss">
swiper-slide {
  height: 200px;
  width: auto;
  cursor: pointer;

  picture::v-deep img {
    height: 200px;
  }
}
</style>
