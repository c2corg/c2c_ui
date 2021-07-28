<template>
  <activities class="cell-activities has-text-secondary" :activities="params.data.activities" />
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style lang="scss" scoped>
.cell-activities {
  font-size: 26px;
}
</style>
