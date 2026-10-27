<template>
  <activities class="cell-activities has-text-secondary" :activities="params.data.activities" />
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

<!-- not scoped: ag-grid-vue3 mounts the renderer through a wrapper component, which drops its scope id -->
<style lang="scss">
.cell-activities {
  font-size: 26px;
}
</style>
