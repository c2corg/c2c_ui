<template>
  <nav class="bottom-nav no-print" :aria-label="$gettext('Main navigation')">
    <ul class="bottom-nav-list">
      <li v-for="tab of tabs" :key="tab.key" class="bottom-nav-item">
        <router-link :to="tab.to" class="bottom-nav-link" :class="{ 'is-active': isActive(tab) }">
          <span class="bottom-nav-icon-wrap">
            <fa-icon :icon="tab.icon" class="bottom-nav-icon" />
            <span v-if="tab.badge" class="bottom-nav-badge" :aria-label="tab.badgeLabel">
              {{ tab.badge > 9 ? '9+' : tab.badge }}
            </span>
          </span>
          <span class="bottom-nav-label">{{ tab.label }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { useOutingQueueStore } from '@/stores/outing-queue';

defineOptions({ name: 'BottomNav' });

interface Tab {
  key: string;
  label: string;
  icon: string;
  to: RouteLocationRaw;
  // the routes for which the tab is the current one
  match: string[];
  badge?: number;
  badgeLabel?: string;
}

const { $gettext } = useGlobalProperties();
const route = useRoute();
const router = useRouter();

const queue = useOutingQueueStore();

const tabs = computed<Tab[]>(() =>
  [
    {
      key: 'search',
      label: $gettext('Search', 'navigation'),
      icon: 'magnifying-glass',
      to: { name: 'topoguide' },
      match: ['topoguide', 'routes', 'waypoints', 'areas', 'maps', 'images'],
    },
    {
      // the activity feed of the home page: latest outings, topo edits and forum posts
      key: 'recent',
      label: $gettext('Recent'),
      icon: 'clock',
      to: { name: 'home' },
      match: ['home'],
    },
    {
      // the documents saved on the device
      key: 'offline',
      label: $gettext('My topos'),
      icon: 'bookmark',
      to: { name: 'offline' },
      match: ['offline'],
      badge: queue.pending.length,
      badgeLabel: $gettext('Outings waiting for you to publish them:') + ' ' + queue.pending.length,
    },
    {
      key: 'me',
      label: $gettext('Me'),
      icon: 'user',
      to: { name: 'me' },
      match: ['me', 'account', 'auth', 'auth-sso', 'preferences', 'following', 'trackers', 'app-settings'],
    },
    {
      key: 'more',
      label: $gettext('More'),
      icon: 'bars',
      to: { name: 'more' },
      match: ['more', 'articles', 'xreports', 'yeti', 'serac', 'itinevert', 'app-guide'],
    },
  ].filter((tab) => router.hasRoute((tab.to as { name: string }).name))
);

// the first tab whose routes contain the current one
const isActive = (tab: Tab) => tab.match.includes(String(route.name ?? ''));
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 28;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  /* a 6 px floor where the safe area is 0 (Android), plus the home indicator of iPhones; 66 px in all, as the beta
     testers kept tapping Safari's address bar under a lower bar */
  padding-bottom: calc(6px + env(safe-area-inset-bottom));
  padding-top: 4px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

.bottom-nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 56px;
}

.bottom-nav-item {
  flex: 1;
  display: flex;
}

.bottom-nav-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #9a9a9a;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  transition: color 0.15s;

  &:hover,
  &:focus {
    color: #4a4a4a;
    text-decoration: none;
  }

  &.is-active {
    color: var(--c2c-color-base-c2c);
  }
}

.bottom-nav-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bottom-nav-icon {
  font-size: 1.3rem;
}

.bottom-nav-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  background: var(--c2c-color-base-c2c);
  color: white;
  font-size: 9px;
  font-weight: 700;
  line-height: 14px;
  border-radius: 7px;
  text-align: center;
  box-shadow: 0 0 0 2px white;
}

.bottom-nav-label {
  line-height: 1;
}
</style>

<style>
html[data-theme='dark'] {
  .bottom-nav {
    background: #232323;
    border-top-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.4);
  }
  .bottom-nav-link {
    color: #8a8a8a;
    &:hover,
    &:focus {
      color: #ccc;
    }
    &.is-active {
      color: #ff9933;
    }
  }
  .bottom-nav-badge {
    box-shadow: 0 0 0 2px #232323;
  }
}
</style>
