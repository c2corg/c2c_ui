<template>
  <picture :class="$attrs.class" :style="$attrs.style">
    <source v-if="avif" type="image/avif" :srcset="avif" />
    <source v-if="webp" type="image/webp" :srcset="webp" />
    <img ref="img" v-bind="imgAttrs" :src="standard" @error.once="onError" />
  </picture>
</template>

<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { getImageUrl, type Image, type ImageSize } from '@/js/image-urls';

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
});

const attrs = useAttrs();

const imgAttrs = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { class: className, style, ...imgAttrs } = attrs;
  return imgAttrs;
});

const avif = computed(() => getImageUrl(props.img, props.size, 'avif'));
const webp = computed(() => getImageUrl(props.img, props.size, 'webp'));
const standard = computed(() => getImageUrl(props.img, props.size));

// In case the "modern" thumbnail is not available, be sure
// to switch to the "basic" version.
function onError(event: Event) {
  if (avif.value) {
    const img = event.target as HTMLImageElement;
    const [first, second] = img.parentElement!.children as unknown as HTMLSourceElement[];
    first.srcset = second.srcset = img.src;
  }
}
</script>
