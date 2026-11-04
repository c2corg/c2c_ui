<template>
  <div v-if="label" class="environment-banner has-background-warning has-text-black has-text-centered no-print">
    <strong class="is-uppercase">{{ label }}</strong> –
    <span v-translate>test environment, the data are not the real ones</span>
  </div>
</template>

<script setup lang="ts">
import { environmentLabel as label } from '@/js/environment-label';

defineOptions({ name: 'EnvironmentBanner' });
</script>

<style scoped lang="scss">
.environment-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
}
</style>
