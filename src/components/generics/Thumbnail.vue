<template>
  <picture :class="$attrs.class" :style="$attrs.style">
    <source v-if="avif" type="image/avif" :srcset="avif" />
    <img ref="img" v-bind="{ ...reservedSize, ...imgAttrs }" :src="standard" @error.once="onError" />
  </picture>
</template>

<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { fallBackToBasicImage, getImageUrl, getThumbnailSize, type Image, type ImageSize } from '@/js/image-urls';

// the classes and style stay on the picture, the other attributes and the listeners go to the image
defineOptions({ inheritAttrs: false });

const props = defineProps({
  img: {
    type: Object as PropType<Image>,
    required: true,
  },
  size: {
    type: String as PropType<ImageSize>,
    default: null,
  },
  // the size of the thumbnail on the <img> (width, height), when the image document gives the original's: the page
  // keeps its space while it loads, instead of shifting (#4883). For an image not sized by CSS: the attributes would
  // otherwise set its size
  reserveSize: {
    type: Boolean,
    default: false,
  },
});

const attrs = useAttrs();

const imgAttrs = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { class: className, style, ...imgAttrs } = attrs;
  return imgAttrs;
});

const reservedSize = computed(() =>
  props.reserveSize && props.size
    ? getThumbnailSize(props.img as Parameters<typeof getThumbnailSize>[0], props.size)
    : undefined
);

const avif = computed(() => getImageUrl(props.img, props.size, 'avif'));
const standard = computed(() => getImageUrl(props.img, props.size));

// In case the AVIF thumbnail is not available, be sure
// to switch to the "basic" version.
function onError(event: Event) {
  if (avif.value) {
    fallBackToBasicImage(event.target as HTMLImageElement);
  }
}
</script>
