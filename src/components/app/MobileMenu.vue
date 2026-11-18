<template>
  <!-- between the top bar and the bottom bar, which stay visible: the entries of the side menu, and its footer -->
  <nav v-if="menu.isOpen" id="mobile-menu" class="mobile-menu no-print" :aria-label="$gettext('Menu')">
    <ul class="menu-list">
      <li v-for="item of items" :key="item.key">
        <router-link :to="item.to" class="menu-link">
          <span class="menu-icon">
            <component :is="item.iconComponent" v-if="item.iconComponent" fixed-width />
            <fa-icon v-else :icon="item.icon!" fixed-width />
          </span>
          <span class="menu-label">{{ item.label }}</span>
          <fa-icon icon="chevron-right" class="menu-chevron" />
        </router-link>
      </li>
    </ul>

    <menu-footer class="menu-footer" />
  </nav>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

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
.mobile-menu {
  position: fixed;
  top: var(--app-top-bar-height);
  bottom: var(--app-bottom-bar-height);
  left: 0;
  right: 0;
  z-index: 27;
  overflow-y: auto;
  padding: 0.75rem 0.75rem 1.5rem;
  background: var(--c2c-body-background-color, var(--c2c-white));
}

.menu-list {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  color: var(--c2c-color-text);
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    color: var(--c2c-color-text);
    outline: none;
  }
}

.menu-icon {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--app-accent-background);
  border-radius: 4px;
}

.menu-label {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.menu-chevron {
  color: #9ca3af;
  flex: 0 0 auto;
}
</style>
