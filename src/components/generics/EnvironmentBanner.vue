<template>
  <div v-if="label" class="environment-label no-print" aria-hidden="true">
    <strong class="is-uppercase">{{ label }}</strong> –
    <span v-translate>test environment, on a copy of the production data</span>
  </div>
</template>

<script setup lang="ts">
import { environmentLabel as label } from '@/js/environment-label';

defineOptions({ name: 'EnvironmentBanner' });
</script>

<style lang="scss">
// A tab hanging under the navigation bar, centered. Fixed and transparent to clicks: it takes no room, blocks
// nothing, goes behind the navigation (z-index 25) and the side menu (30), so their menus and buttons stay on top.
.environment-label {
  position: fixed;
  top: $navbar-height;
  left: 50%;
  transform: translateX(-50%);
  z-index: 24;
  max-width: calc(100vw - 2rem);
  padding: 0.1rem 0.8rem;
  border-radius: 0 0 6px 6px;
  background: #ffdd57;
  color: #363636;
  font-size: 0.75rem;
  text-align: center;
  opacity: 0.92;
  pointer-events: none;
}

// the navigation bar is taller when the ad is shown (App.vue)
.nav-dfm .environment-label {
  top: $navbarad-height;
}
</style>
