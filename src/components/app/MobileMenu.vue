<template>
  <!-- between the top bar and the bottom bar, which stay visible: the side menu of the site, for a finger -->
  <nav v-if="menu.isOpen" id="mobile-menu" class="mobile-menu no-print" :aria-label="$gettext('Menu')">
    <menu-entries :items="items" touch />
    <menu-footer class="menu-footer" touch />
  </nav>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import MenuEntries from './MenuEntries.vue';
import MenuFooter from './MenuFooter.vue';

import { useMainMenuItems } from '@/js/composables/main-menu';
import { useMobileMenuStore } from '@/stores/mobile-menu';

defineOptions({ name: 'MobileMenu' });

// the same entries as the side menu of the site
const items = useMainMenuItems();
const menu = useMobileMenuStore();
const route = useRoute();

// the menu closes with the page, and with the phone layout (this component is unmounted by the desktop one)
watch(() => route.fullPath, menu.close);
onBeforeUnmount(menu.close);

// Escape closes it wherever the focus is
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    menu.close();
  }
};
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
/* the look of the side menu: a plain white page, the rows with their orange left mark */
.mobile-menu {
  position: fixed;
  top: var(--app-top-bar-height);
  bottom: var(--app-bottom-bar-height);
  left: 0;
  right: 0;
  z-index: 27;
  overflow-y: auto;
  padding: 0.5rem 0 1rem;
  background: var(--c2c-white);
}

.menu-footer {
  margin-top: 1.5rem;
}

html[data-theme='dark'] .mobile-menu {
  background: var(--app-dark-field);
}
</style>
