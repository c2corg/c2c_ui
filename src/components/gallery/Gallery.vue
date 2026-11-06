<template>
  <swiper-container slides-per-view="auto" space-between="15" class="swiper">
    <swiper-slide
      v-for="image of images"
      :key="image.document_id"
      :style="{ height: SLIDE_HEIGHT + 'px', width: slideWidth(image) }"
    >
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

<script setup lang="ts">
import { watch, type PropType } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import '@/js/swiper-element';

type GalleryImage = {
  document_id: number;
  filename?: string;
  locales: { title?: string | null }[];
  width?: number | null;
  height?: number | null;
};

const SLIDE_HEIGHT = 200;

// the width of an image at the height of the slides, when the API gives its size: the slide keeps it while the image
// loads, instead of growing from nothing and pushing the next ones (#4883)
function slideWidth(image: GalleryImage) {
  return image.width && image.height ? `${Math.round((SLIDE_HEIGHT * image.width) / image.height)}px` : undefined;
}

const props = defineProps({
  images: {
    type: Array as PropType<GalleryImage[]>,
    required: true,
  },
});

const { $imageViewer } = useGlobalProperties();

// deep 1: also when images are added to the array (uploads), as Vue 2 array watchers did
watch(
  () => props.images,
  () => props.images.forEach($imageViewer.push),
  { deep: 1, immediate: true }
);
</script>

<style scoped lang="scss">
// the width of its box, also as a flex item (card rows): its minimum width would otherwise be the width of all the
// slides, which have the width of their image since the API gives the image sizes, and it would overflow the card
swiper-container {
  width: 100%;
  min-width: 0;
}

swiper-slide {
  height: 200px;
  width: auto;
  cursor: pointer;

  picture :deep(img) {
    height: 200px;
  }
}
</style>
