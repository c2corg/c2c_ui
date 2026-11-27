<template>
  <span>
    {{ $dateUtils.toLocalizedString(params.data.date_end, 'll') }}
  </span>
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import type { PropType } from 'vue';

// the grid gives each cell its params: the row document is params.data
defineProps({
  params: {
    type: Object as PropType<ICellRendererParams>,
    required: true,
  },
});
</script>
