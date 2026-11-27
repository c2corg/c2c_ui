<template>
  <transport-accessibility
    v-if="params.context?.transportContext"
    :document="params.data"
    :transport-context="params.context.transportContext"
  />
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import type { PropType } from 'vue';

// the grid gives each cell its params: the row document is params.data, the transport search is in the grid context
defineProps({
  params: {
    type: Object as PropType<ICellRendererParams>,
    required: true,
  },
});
</script>
