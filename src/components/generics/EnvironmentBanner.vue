<template>
  <div v-if="label" class="environment-banner no-print" aria-hidden="true">
    <!-- fixed, and transparent to clicks: it never takes room from, nor hides, the navigation or the map controls -->
    <div class="environment-stripe" />
    <div class="environment-label">
      <strong class="is-uppercase">{{ label }}</strong> –
      <span v-translate>test environment, on a copy of the production data</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { environmentLabel as label } from '@/js/environment-label';

defineOptions({ name: 'EnvironmentBanner' });
</script>

<style scoped lang="scss">
.environment-banner {
  pointer-events: none;
}

// thin stripe over the top of the page
.environment-stripe {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 35;
  background: repeating-linear-gradient(135deg, #ffdd57 0 12px, #363636 12px 24px);
}

// small label in a corner, away from the navigation
.environment-label {
  position: fixed;
  bottom: 0.5rem;
  left: 0.5rem;
  z-index: 35;
  padding: 0.15rem 0.6rem;
  border-radius: 4px;
  background: #ffdd57;
  color: #363636;
  font-size: 0.75rem;
  opacity: 0.9;
}
</style>
