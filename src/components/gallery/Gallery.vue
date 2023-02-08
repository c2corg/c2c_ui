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
  props: {
    images: {
      type: Array,
      required: true,
    },
  },

  watch: {
    images: function () {
      this.images.forEach(this.$imageViewer.push);
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
