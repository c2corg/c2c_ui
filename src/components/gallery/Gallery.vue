<template>
  <swiper :options="$options.swiperOption" class="swiper">
    <swiper-slide v-for="image of images" :key="image.document_id">
      <thumbnail
        :img="image"
        size="MI"
        :alt="image.locales[0].title"
        :title="image.locales[0].title"
        @click="$imageViewer.show(image)"
        loading="lazy"
      />
    </swiper-slide>
  </swiper>
</template>

<script>
import getAwesomeSwiper from '@brunobesson/vue-awesome-swiper/dist/exporter';
import { Swiper as SwiperClass } from 'swiper/core';

const { Swiper, SwiperSlide } = getAwesomeSwiper(SwiperClass);

export default {
  components: {
    Swiper,
    SwiperSlide,
  },

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

  swiperOption: {
    slidesPerView: 'auto',
    spaceBetween: 15,
  },
};
</script>

<style scoped lang="scss">
@import '~swiper/swiper';
@import '~swiper/components/lazy/lazy';
@import '~swiper/components/navigation/navigation';
@import '~swiper/components/zoom/zoom';

.swiper {
  .swiper-slide {
    height: 200px;
    width: auto;
    cursor: pointer;

    picture::v-deep img {
      height: 200px;
    }
  }

  .swiper-button-disabled {
    opacity: 100;
  }
}
</style>
