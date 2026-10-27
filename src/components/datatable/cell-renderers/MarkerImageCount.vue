<template>
  <generic-marker-image-count :image-count="params.data.img_count" />
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import type { PropType } from 'vue';

// named apart from this renderer, which has the same name
import GenericMarkerImageCount from '@/components/generics/markers/MarkerImageCount.vue';

// the grid gives each cell its params: the row document is params.data
defineProps({
  params: {
    type: Object as PropType<ICellRendererParams>,
    required: true,
  },
});
</script>
