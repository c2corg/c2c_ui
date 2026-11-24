<template>
  <div class="section">
    <html-header :title="$gettext('Moderation')" />
    <h1 class="title is-1" v-translate>Moderation</h1>

    <div v-if="!canModerate" class="notification is-warning" v-translate>This page is reserved to the moderators.</div>

    <template v-else>
      <div class="tabs is-boxed">
        <ul>
          <li v-for="tab of tabs" :key="tab.name" :class="{ 'is-active': tab.name === activeTab }">
            <router-link v-if="tab.available" :to="{ name: 'moderation', params: { tab: tab.name } }">
              <fa-icon :icon="tab.icon" class="mr-2" />
              <span>{{ tab.title }}</span>
              <span v-if="tab.name === 'accounts' && actionable" class="tag is-danger is-rounded ml-2">{{
                actionable
              }}</span>
            </router-link>
            <a v-else class="is-disabled" :title="tab.unavailable" aria-disabled="true">
              <fa-icon :icon="tab.icon" class="mr-2" />
              <span>{{ tab.title }}</span>
            </a>
          </li>
        </ul>
      </div>

      <deleted-documents v-if="activeTab === 'deleted'" />
      <orphan-images v-else-if="activeTab === 'orphans'" />
      <broken-embeds v-else-if="activeTab === 'broken-images'" />
      <image-duplicates v-else-if="activeTab === 'duplicates'" />
      <account-removals v-else-if="activeTab === 'accounts'" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AccountRemovals from './AccountRemovals.vue';
import BrokenEmbeds from './BrokenEmbeds.vue';
import DeletedDocuments from './DeletedDocuments.vue';
import ImageDuplicates from './ImageDuplicates.vue';
import OrphanImages from './OrphanImages.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';
import { useModerationRoles } from '@/js/composables/moderation';
import { actionableCount as actionable } from '@/stores/moderation-count';

useNoRobots();

const { $gettext } = useGlobalProperties();
const route = useRoute();
const { topoguide: isTopoguideModerator, any: canModerate } = useModerationRoles();

// the edits to check are planned. The deleted
// documents are for the moderators of the topoguide only (the API refuses the others)
const tabs = computed(() => [
  {
    name: 'deleted',
    title: $gettext('Deleted documents'),
    icon: 'trash',
    available: isTopoguideModerator.value,
    unavailable: $gettext('For the moderators of the topoguide'),
  },
  {
    name: 'orphans',
    title: $gettext('Orphan images'),
    icon: 'image',
    available: isTopoguideModerator.value,
    unavailable: $gettext('For the moderators of the topoguide'),
  },
  {
    name: 'broken-images',
    title: $gettext('Broken images'),
    icon: 'link-slash',
    available: isTopoguideModerator.value,
    unavailable: $gettext('For the moderators of the topoguide'),
  },
  {
    name: 'duplicates',
    title: $gettext('Duplicate images'),
    icon: 'object-group',
    available: isTopoguideModerator.value,
    unavailable: $gettext('For the moderators of the topoguide'),
  },
  {
    name: 'accounts',
    title: $gettext('Accounts'),
    icon: 'users',
    // the removal requests are for the moderators of both sides
    available: canModerate.value,
    unavailable: $gettext('For the moderators'),
  },
  {
    name: 'edits',
    title: $gettext('Edits to check'),
    icon: 'edit',
    available: false,
    unavailable: $gettext('Coming soon'),
  },
]);

const activeTab = computed(() => {
  const tab = route.params.tab as string | undefined;
  const available = tabs.value.filter((t) => t.available);
  return (available.find((t) => t.name === tab) ?? available[0])?.name;
});
</script>

<style scoped>
.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
