<template>
  <div v-if="images.length !== 0" class="box no-print image-box">
    <gallery :images="images" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Gallery from '@/components/gallery/Gallery.vue';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

// the associated images come from the API: they have their ids
type GalleryImages = InstanceType<typeof Gallery>['$props']['images'];
const images = computed(() => (props.document.associations?.images ?? []) as GalleryImages);
</script>
