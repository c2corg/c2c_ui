<template>
  <picture>
    <source v-if="avif" type="image/avif" :srcset="avif" />
    <source v-if="webp" type="image/webp" :srcset="webp" />
    <img v-bind="$attrs" v-on="$listeners" :src="standard" />
  </picture>
</template>

<script>
import { getImageUrl } from '@/js/image-urls';

export default {
  inheritAttrs: false,
  props: {
    img: {
      type: Object,
      required: true,
    },
    size: {
      type: String,
      default: null,
    },
  },
  computed: {
    avif() {
      return getImageUrl(this.img, this.size, 'avif');
    },
    webp() {
      return getImageUrl(this.img, this.size, 'webp');
    },
    standard() {
      return getImageUrl(this.img, this.size);
    },
  },
};
</script>
