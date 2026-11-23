<template>
  <!-- between the top bar and the bottom bar, which stay visible: the side menu of the site, for a finger -->
  <nav
    v-if="menu.isOpen"
    id="mobile-menu"
    class="mobile-menu no-print"
    :aria-label="$gettext('Menu')"
    @click="onLinkClick"
  >
    <menu-entries :items="items" touch />
    <menu-footer class="menu-footer" touch />
  </nav>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import MenuEntries from './MenuEntries.vue';
import MenuFooter from './MenuFooter.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { useMainMenuItems } from '@/js/composables/main-menu';
import { useMobileMenuStore } from '@/stores/mobile-menu';

defineOptions({ name: 'MobileMenu' });

// the same entries as the side menu of the site
const mainItems = useMainMenuItems();
const { $gettext, $user } = useGlobalProperties();

// logged out, the phone layout has no gear menu (the navigation of the site) nor Me page: Settings, with the language, is here
const items = computed(() =>
  $user.isLogged
    ? mainItems.value
    : [
        ...mainItems.value,
        { key: 'settings', label: $gettext('Settings'), to: { name: 'settings' }, match: ['settings'], icon: 'gears' },
      ]
);
const menu = useMobileMenuStore();
const route = useRoute();

// the menu closes with the page, and with the phone layout (this component is unmounted by the desktop one)
watch(() => route.fullPath, menu.close);
onBeforeUnmount(menu.close);

// any link closes it too, also the one of the page already shown, where the route does not change
const onLinkClick = (event: MouseEvent) => {
  if ((event.target as Element | null)?.closest('a')) {
    menu.close();
  }
};

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
  top: var(--c2c-navbar-height);
  bottom: var(--c2c-bottom-bar-height);
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
