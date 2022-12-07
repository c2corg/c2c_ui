<template>
  <picture>
    <source v-if="avif" type="image/avif" :srcset="avif" />
    <source v-if="webp" type="image/webp" :srcset="webp" />
    <img ref="img" v-bind="$attrs" v-on="$listeners" :src="standard" @error.once="onError" />
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
  methods: {
    onError(event) {
      if (this.avif) {
        const img = event.target;
        img.parentNode.children[0].srcset = img.parentNode.children[1].srcset = img.src;
      }
    },
  },
};
</script>
