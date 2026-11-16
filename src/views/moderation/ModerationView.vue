<template>
  <div class="section">
    <html-header :title="$gettext('Moderation')" />
    <h1 class="title is-1" v-translate>Moderation</h1>

    <div v-if="!$user.isModerator" class="notification is-warning" v-translate>
      This page is reserved to the moderators.
    </div>

    <template v-else>
      <div class="tabs is-boxed">
        <ul>
          <li v-for="tab of tabs" :key="tab.name" :class="{ 'is-active': tab.name === activeTab }">
            <router-link v-if="tab.available" :to="{ name: 'moderation', params: { tab: tab.name } }">
              <fa-icon :icon="tab.icon" class="mr-2" />
              <span>{{ tab.title }}</span>
            </router-link>
            <a v-else class="is-disabled" :title="$gettext('Coming soon')" aria-disabled="true">
              <fa-icon :icon="tab.icon" class="mr-2" />
              <span>{{ tab.title }}</span>
            </a>
          </li>
        </ul>
      </div>

      <deleted-documents v-if="activeTab === 'deleted'" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import DeletedDocuments from './DeletedDocuments.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';

useNoRobots();

const { $gettext } = useGlobalProperties();
const route = useRoute();

// the other tabs are planned: the removal and merge requests of the accounts, the edits to check
const tabs = computed(() => [
  { name: 'deleted', title: $gettext('Deleted documents'), icon: 'trash', available: true },
  { name: 'accounts', title: $gettext('Accounts'), icon: 'users', available: false },
  { name: 'edits', title: $gettext('Edits to check'), icon: 'edit', available: false },
]);

const activeTab = computed(() => {
  const tab = route.params.tab as string | undefined;
  return tabs.value.some((t) => t.name === tab && t.available) ? tab : 'deleted';
});
</script>

<style scoped>
.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
