<template>
  <section class="section more-view">
    <div class="container">
      <h1 class="title is-5">{{ $gettext('Menu') }}</h1>

      <ul class="tile-grid">
        <li v-for="item of items" :key="item.key">
          <router-link :to="item.to" class="tile-link">
            <span class="tile-icon">
              <component :is="item.iconComponent" v-if="item.iconComponent" fixed-width />
              <fa-icon v-else :icon="item.icon!" fixed-width />
            </span>
            <span class="tile-label">{{ item.label }}</span>
            <fa-icon icon="chevron-right" class="tile-chevron" />
          </router-link>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useMainMenuItems } from '@/js/composables/main-menu';

defineOptions({ name: 'MoreView' });

const { $gettext } = useGlobalProperties();

// the same entries as the side menu of the site
const items = useMainMenuItems();
</script>

<style scoped>
.title {
  margin-bottom: 1rem;
}

.tile-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.tile-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  color: var(--c2c-color-text);
  text-decoration: none;
  transition: box-shadow 0.15s;

  &:hover,
  &:focus {
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    color: var(--c2c-color-text);
    outline: none;
  }
}

.tile-icon {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--app-accent-background);
  border-radius: 4px;
}

.tile-label {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.tile-chevron {
  color: #9ca3af;
  flex: 0 0 auto;
}
</style>
