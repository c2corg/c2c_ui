<template>
  <generic-marker-quality :quality="params.data.quality" />
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import type { PropType } from 'vue';

// named apart from this renderer, which has the same name
import GenericMarkerQuality from '@/components/generics/markers/MarkerQuality.vue';

// the grid gives each cell its params: the row document is params.data
defineProps({
  params: {
    type: Object as PropType<ICellRendererParams>,
    required: true,
  },
});
</script>
