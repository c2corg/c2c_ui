<template>
  <activities class="cell-activities has-text-secondary" :activities="params.data.activities" />
</template>

<script>
export default {};
</script>

<!-- not scoped: ag-grid-vue3 mounts the renderer through a wrapper component, which drops its scope id -->
<style lang="scss">
.cell-activities {
  font-size: 26px;
}
</style>
