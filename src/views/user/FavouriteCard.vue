<template>
  <article class="favourite-card box">
    <router-link
      :to="{ name: favourite.type, params: { id: favourite.id, lang: favourite.lang ?? undefined } }"
      class="favourite-card-body"
    >
      <icon-document :document-type="favourite.type" class="favourite-card-icon" />
      <span class="favourite-card-text">
        <span class="favourite-card-title">{{ favourite.title }}</span>
        <span v-if="row.entry" class="favourite-card-meta">
          <!-- colour only when the copy needs something -->
          <span v-if="state === 'incomplete'" class="tag is-danger is-light" :title="attentionTitle">
            <fa-icon icon="triangle-exclamation" />&nbsp;{{ $gettext('Incomplete') }}
          </span>
          <span v-else-if="state === 'old'" class="tag is-warning is-light" :title="attentionTitle">
            <fa-icon icon="triangle-exclamation" />&nbsp;{{ $gettext('Old copy') }}
          </span>
          <span class="tag is-light">
            <fa-icon :icon="busy ? 'spinner' : 'arrow-down'" :spin="busy" />&nbsp;{{ $gettext('Offline') }}
          </span>
          <span class="is-size-7 has-text-grey">
            <template v-if="row.entry.downloadedAt">{{ $dateUtils.timeAgo(row.entry.downloadedAt) }}</template>
            <!-- the files it shares with another topo count in both -->
            <template v-if="row.entry.assets?.bytes">
              · {{ formatSize(row.entry.assets.bytes, $language.current) }}</template
            >
          </span>
        </span>
      </span>
    </router-link>
    <div class="favourite-card-actions">
      <button
        v-if="!row.entry || busy"
        type="button"
        class="button is-small is-text"
        :disabled="busy || !offline.online"
        :title="offline.online ? $gettext('Save offline') : $gettext('Save offline once online')"
        @click="emit('download')"
      >
        <fa-icon :icon="busy ? 'spinner' : 'download'" :spin="busy" />
      </button>
      <!-- an old copy, or one the network cut: everything again, partial downloads are not tracked -->
      <button
        v-else-if="state !== 'fresh'"
        type="button"
        class="button is-small is-text"
        :disabled="!offline.online"
        :title="offline.online ? $gettext('Download again') : $gettext('Download again once online')"
        @click="emit('download')"
      >
        <fa-icon icon="rotate" />
      </button>
      <button
        type="button"
        class="button is-small is-text"
        :title="$gettext('Actions')"
        :aria-label="$gettext('Actions')"
        @click="emit('actions')"
      >
        <fa-icon icon="ellipsis-vertical" />
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { copyStateOf, formatSize, type FavouriteRow } from './favourite-rows';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { useOfflineStore } from '@/stores/offline';

const props = defineProps<{ row: FavouriteRow }>();
const emit = defineEmits<{ download: []; actions: [] }>();

const { $gettext } = useGlobalProperties();
const offline = useOfflineStore();

const favourite = computed(() => props.row.favourite);
const busy = computed(() => offline.isDownloading(favourite.value.type, favourite.value.id));
const state = computed(() => copyStateOf(props.row.entry));

const attentionTitle = computed(() => {
  const entry = props.row.entry;
  if (state.value === 'incomplete') {
    return entry?.assets?.missing
      ? `${$gettext('Files no longer on this device:')} ${entry.assets.missing}`
      : $gettext('Some files could not be downloaded');
  }
  return $gettext('Saved more than a week ago: conditions may have changed. Download it again before leaving.');
});
</script>

<style scoped>
.favourite-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.favourite-card-body {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  color: var(--c2c-text);
}

.favourite-card-icon {
  flex-shrink: 0;
  color: var(--c2c-primary);
  font-size: 1.25rem;
}

.favourite-card-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.favourite-card-title {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favourite-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;

  .tag:not(.is-danger, .is-warning) {
    color: var(--c2c-grey-dark);
  }
}

.favourite-card-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}
</style>
