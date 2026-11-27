<template>
  <generic-marker-soft-mobility v-show="params.data.public_transport" />
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import type { PropType } from 'vue';

// named apart from this renderer, which has the same name
import GenericMarkerSoftMobility from '@/components/generics/markers/MarkerSoftMobility.vue';

// the grid gives each cell its params: the row document is params.data
defineProps({
  params: {
    type: Object as PropType<ICellRendererParams>,
    required: true,
  },
});
</script>
