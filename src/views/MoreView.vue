<template>
  <section class="section more-view">
    <div class="container">
      <h1 class="title is-5">{{ $gettext('More') }}</h1>
      <p class="subtitle is-7">{{ $gettext('The other sections of Camptocamp') }}</p>

      <ul class="tile-grid">
        <li v-for="tile of tiles" :key="tile.key">
          <router-link :to="tile.to" class="tile-link">
            <span class="tile-icon"><custom-icon :name="tile.icon" :size="34" /></span>
            <span class="tile-text">
              <span class="tile-label">{{ tile.label }}</span>
              <span class="tile-desc">{{ tile.desc }}</span>
            </span>
            <fa-icon icon="chevron-right" class="tile-chevron" />
          </router-link>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import CustomIcon from '@/components/app/CustomIcon.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';

defineOptions({ name: 'MoreView' });

interface Tile {
  key: string;
  label: string;
  desc: string;
  icon: string;
  to: RouteLocationRaw;
}

const { $gettext } = useGlobalProperties();

// the sections the bottom bar doesn't have, by their landing pages (as the side menu of the site)
const tiles = computed<Tile[]>(() => [
  {
    key: 'topoguide',
    label: $gettext('Topoguide'),
    desc: $gettext('Routes, waypoints, outings'),
    icon: 'mountain-trail',
    to: { name: 'topoguide' },
  },
  {
    key: 'articles',
    label: $gettext('Articles'),
    desc: $gettext('Techniques, advice, stories'),
    icon: 'notebook',
    to: { name: 'articles' },
  },
  {
    key: 'serac',
    label: 'SERAC',
    desc: $gettext('Incidents and accidents'),
    icon: 'serac-warning',
    to: { name: 'serac' },
  },
  {
    key: 'yeti',
    label: 'Yeti',
    desc: $gettext('Avalanche risk assessment'),
    icon: 'snowflake-compass',
    to: { name: 'yeti' },
  },
  {
    key: 'itinevert',
    label: 'Itinévert',
    desc: $gettext('To the mountains by public transport'),
    icon: 'bus-transport',
    to: { name: 'itinevert' },
  },
  {
    key: 'forum',
    label: $gettext('Forum'),
    desc: $gettext('Discussions of the community'),
    icon: 'speech-bubbles',
    to: { name: 'forum' },
  },
]);
</script>

<style scoped>
.title {
  margin-bottom: 0.25rem;
}

.subtitle {
  margin-bottom: 1rem;
  color: #6b6b6b;
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
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  color: #4a4a4a;
  text-decoration: none;
  transition: box-shadow 0.15s;

  &:hover,
  &:focus {
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    color: #4a4a4a;
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
  background: #fff5e6;
  border-radius: 4px;
}

.tile-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tile-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.tile-desc {
  font-size: 0.75rem;
  color: #6b6b6b;
}

.tile-chevron {
  color: #9ca3af;
  flex: 0 0 auto;
}
</style>

<style>
html[data-theme='dark'] {
  .more-view .tile-link {
    background: #2a2a2a;
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e5e5;
    &:hover,
    &:focus {
      color: #f5f5f5;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }
  }
  .more-view .tile-icon {
    background: #3a2f1a;
  }
  .more-view .subtitle,
  .more-view .tile-desc {
    color: #9a9a9a;
  }
}
</style>
