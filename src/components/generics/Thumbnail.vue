<template>
  <picture :class="$attrs.class" :style="$attrs.style">
    <source v-if="avif" type="image/avif" :srcset="avif" />
    <source v-if="webp" type="image/webp" :srcset="webp" />
    <img ref="img" v-bind="imgAttrs" :src="standard" @error.once="onError" />
  </picture>
</template>

<script>
import { getImageUrl } from '@/js/image-urls';

export default {
  // the classes and style stay on the picture, the other attributes and the listeners go to the image
  inheritAttrs: false,
  // Vue 3 $attrs, with class, style and listeners (without the Vue 2 behaviour of @vue/compat)
  compatConfig: { INSTANCE_ATTRS_CLASS_STYLE: false, INSTANCE_LISTENERS: false },
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
    imgAttrs() {
      // eslint-disable-next-line no-unused-vars
      const { class: className, style, ...attrs } = this.$attrs;
      return attrs;
    },

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
    // In case the "modern" thumbnail is not available, be sure
    // to switch to the "basic" version.
    onError(event) {
      if (this.avif) {
        const img = event.target;
        img.parentNode.children[0].srcset = img.parentNode.children[1].srcset = img.src;
      }
    },
  },
};
</script>
