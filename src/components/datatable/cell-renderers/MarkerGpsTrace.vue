<template>
  <generic-marker-gps-trace v-show="params.data.geometry.has_geom_detail" />
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import type { PropType } from 'vue';

// named apart from this renderer, which has the same name
import GenericMarkerGpsTrace from '@/components/generics/markers/MarkerGpsTrace.vue';

// the grid gives each cell its params: the row document is params.data
defineProps({
  params: {
    type: Object as PropType<ICellRendererParams>,
    required: true,
  },
});
</script>
