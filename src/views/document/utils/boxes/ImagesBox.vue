<template>
  <div v-if="images.length !== 0" class="box no-print image-box">
    <gallery :images="images" :priority="priority" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Gallery from '@/components/gallery/Gallery.vue';
import { documentProperty } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  // the box is at the top of the page: see Gallery
  priority: {
    type: Boolean,
    default: false,
  },
});

// the associated images come from the API: they have their ids
type GalleryImages = InstanceType<typeof Gallery>['$props']['images'];
const images = computed(() => (props.document.associations?.images ?? []) as GalleryImages);
</script>
