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

<script setup lang="ts">
import { watch, type PropType } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';

type GalleryImage = { document_id: number; filename?: string; locales: { title?: string | null }[] };

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
swiper-slide {
  height: 200px;
  width: auto;
  cursor: pointer;

  picture::v-deep img {
    height: 200px;
  }
}
</style>
