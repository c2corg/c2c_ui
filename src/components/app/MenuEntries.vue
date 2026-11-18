<template>
  <!-- the entries of the main menu, as the side menu of the site shows them -->
  <template v-for="item of items" :key="item.key">
    <!-- a plain link when asked, so that the page is refreshed if you are already on it (Itinevert) -->
    <component
      :is="item.reload ? 'a' : 'router-link'"
      v-bind="item.reload ? { href: $router.resolve(item.to).href } : { to: item.to }"
    >
      <span
        class="menu-item is-ellipsed"
        :class="{ 'router-link-active': item.match.includes(String($route.name)), 'is-touch': touch }"
      >
        <component :is="item.iconComponent" v-if="item.iconComponent" fixed-width />
        <fa-icon v-else :icon="item.icon!" fixed-width />
        <span class="menu-item-text"> {{ item.label }} </span>
      </span>
    </component>
  </template>
</template>

<script setup lang="ts">
import type { MainMenuItem } from '@/js/composables/main-menu';

defineOptions({ name: 'MenuEntries' });

defineProps<{
  items: MainMenuItem[];
  // taller rows, for a finger
  touch?: boolean;
}>();
</script>

<style scoped>
.menu-item {
  display: block;
  padding: 6px 10px;
  border-left: 5px solid var(--c2c-white);
  color: var(--c2c-text);
}

.menu-item.is-touch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 52px;
  padding: 8px 12px;
}

.menu-item:hover {
  background: var(--c2c-light);
  border-left: 5px solid var(--c2c-color-base-c2c-lighter);
}

.menu-item-text {
  margin-left: 0;
  font-size: 1.1rem;
}

.menu-item.router-link-active {
  border-left: 5px solid var(--c2c-color-base-c2c);
  font-weight: bold;
}

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): the white left border takes the color of the dark menu */
html[data-theme='dark'] .menu-item {
  border-left-color: var(--app-dark-field);
}

html[data-theme='dark'] .menu-item:hover {
  background: var(--app-dark-surface);
}
</style>
