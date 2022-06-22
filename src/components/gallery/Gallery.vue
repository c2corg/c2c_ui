<template>
  <swiper :options="$options.swiperOption" class="swiper">
    <swiper-slide v-for="image of images" :key="image.document_id">
      <img
        :src="getUrl(image)"
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

import imageUrls from '@/js/image-urls';

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
      this.images.map(this.$imageViewer.push);
    },
  },

  created() {
    this.images.map(this.$imageViewer.push);
  },

  methods: {
    getUrl(image) {
      return imageUrls.getMedium(image);
    },
  },

  swiperOption: {
    slidesPerView: 'auto',
    spaceBetween: 15,
  },
};
</script>

<style scoped lang="scss">
@import '~swiper/swiper.scss';
@import '~swiper/components/lazy/lazy.scss';
@import '~swiper/components/navigation/navigation.scss';
@import '~swiper/components/zoom/zoom.scss';

.swiper {
  .swiper-slide {
    height: 200px;
    width: auto;
    cursor: pointer;

    img {
      height: 200px;
    }
  }

  .swiper-button-disabled {
    opacity: 100;
  }
}
</style>
