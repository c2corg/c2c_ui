<template>
  <nav class="bottom-nav no-print" :aria-label="$gettext('Main navigation')">
    <ul class="bottom-nav-list">
      <li v-for="tab of tabs" :key="tab.key" class="bottom-nav-item">
        <!-- the forum is another site: a plain link to it -->
        <component
          :is="tab.href ? 'a' : 'router-link'"
          v-bind="tab.href ? { href: tab.href } : { to: tab.to }"
          class="bottom-nav-link"
          :class="{ 'is-active': isActive(tab) }"
          @click="menu.close()"
        >
          <span class="bottom-nav-icon-wrap">
            <component :is="tab.iconComponent" v-if="tab.iconComponent" class="bottom-nav-icon" />
            <fa-icon v-else :icon="tab.icon!" class="bottom-nav-icon" />
            <span v-if="tab.badge" class="bottom-nav-badge" :class="tab.badgeClass" :aria-label="tab.badgeLabel">
              {{ tab.badge > 9 ? '9+' : tab.badge }}
            </span>
          </span>
          <span class="bottom-nav-label">{{ tab.label }}</span>
        </component>
      </li>
      <li class="bottom-nav-item">
        <!-- opens the menu panel (MobileMenu.vue), the entries of the side menu of the site -->
        <button
          type="button"
          class="bottom-nav-link"
          :class="{ 'is-active': menu.isOpen }"
          :aria-expanded="menu.isOpen"
          aria-controls="mobile-menu"
          @click="menu.toggle()"
        >
          <span class="bottom-nav-icon-wrap"><fa-icon icon="bars" class="bottom-nav-icon" /></span>
          <span class="bottom-nav-label">{{ $gettext('Menu') }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch, type Component } from 'vue';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';

import IconForum from '@/components/generics/icons/IconForum.vue';
import IconTopoguide from '@/components/generics/icons/IconTopoguide.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';
import config from '@/js/config';
import type { useForumNotificationsStore } from '@/stores/forum-notifications';
import { useMobileMenuStore } from '@/stores/mobile-menu';
import { useOutingQueueStore } from '@/stores/outing-queue';

defineOptions({ name: 'BottomNav' });

interface Tab {
  key: string;
  label: string;
  icon?: string;
  iconComponent?: Component;
  // a page of the UI, or another site by its address
  to?: RouteLocationRaw;
  href?: string;
  // the routes for which the tab is the current one
  match: string[];
  badge?: number;
  badgeLabel?: string;
  badgeClass?: string;
}

const { $gettext, $user } = useGlobalProperties();
const route = useRoute();
const router = useRouter();

const queue = useOutingQueueStore();
const menu = useMobileMenuStore();

// the unread forum notifications of the signed in user: the store that the navigation starts (Navigation.vue, mounted
// but hidden in this layout), loaded on the first sign in
const forumNotifications = shallowRef<ReturnType<typeof useForumNotificationsStore> | null>(null);
watch(
  () => $user.isLogged && !!$user.forumUsername,
  async (signedIn) => {
    if (signedIn && !forumNotifications.value) {
      const { useForumNotificationsStore } = await import('@/stores/forum-notifications');
      forumNotifications.value = useForumNotificationsStore();
    }
  },
  { immediate: true }
);

// like the forum's own avatar: its messages first (green), else its other notifications (blue)
const forumBadge = computed(() => {
  const highPriority = forumNotifications.value?.unreadHighPriority ?? 0;
  const unread = forumNotifications.value?.unread ?? 0;
  if (highPriority) {
    return { badge: highPriority, badgeClass: 'is-forum-messages', badgeLabel: $gettext('Forum messages') };
  }
  if (unread) {
    return { badge: unread, badgeClass: 'is-forum-notifications', badgeLabel: $gettext('Forum notifications') };
  }
  return {};
});

const tabs = computed<Tab[]>(() =>
  [
    {
      // the activity feed of the home page: latest outings, topo edits and forum posts
      key: 'home',
      label: $gettext('Home'),
      icon: 'home',
      to: { name: 'home' },
      match: ['home'],
    },
    {
      key: 'topoguide',
      label: $gettext('Topoguide'),
      iconComponent: IconTopoguide,
      to: { name: 'topoguide' },
      match: ['topoguide', 'routes', 'waypoints', 'areas', 'maps', 'images', 'route', 'waypoint', 'area'],
    },
    {
      // the documents saved on the device
      key: 'offline',
      label: $gettext('Favourites'),
      icon: 'bookmark',
      to: { name: 'offline' },
      match: ['offline'],
      badge: queue.pending.length,
      badgeLabel: $gettext('Outings waiting for you to publish them:') + ' ' + queue.pending.length,
    },
    {
      key: 'forum',
      label: $gettext('Forum'),
      iconComponent: IconForum,
      href: config.urls.forum,
      match: [],
      ...forumBadge.value,
    },
  ].filter((tab) => !tab.to || router.hasRoute((tab.to as { name: string }).name))
);

// the tab of the current route, unless the menu panel covers the page
const isActive = (tab: Tab) => !menu.isOpen && tab.match.includes(String(route.name ?? ''));
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 28;
  background: var(--app-bar);
  border-top: 1px solid var(--app-border);
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
  color: var(--app-dark-text-muted);
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: color 0.15s;

  &:hover,
  &:focus {
    color: var(--c2c-color-text);
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
  color: var(--c2c-white);
  font-size: 9px;
  font-weight: 700;
  line-height: 14px;
  border-radius: 7px;
  text-align: center;
  box-shadow: 0 0 0 2px var(--app-bar);

  /* the forum's colors, as on its avatar badges (Navigation.vue) */
  &.is-forum-notifications {
    background: #337ab7;
  }

  &.is-forum-messages {
    background: #090;
  }
}

.bottom-nav-label {
  line-height: 1;
}
</style>
