<template>
  <section class="section offline-view">
    <html-header :title="$gettext('My topos')" />
    <div class="container">
      <header class="offline-header">
        <h1 class="title is-4">{{ $gettext('My topos') }}</h1>
        <span class="tag" :class="offline.online ? 'is-success is-light' : 'is-warning'">
          <fa-icon :icon="offline.online ? 'wifi' : 'plug'" />
          &nbsp;{{ offline.online ? $gettext('Online') : $gettext('Offline') }}
        </span>
        <span v-if="usage" class="is-size-7 has-text-grey">{{ usage }} {{ $gettext('used on this device') }}</span>
      </header>

      <!-- The outings written on the phone (src/stores/outing-queue.ts). "Waiting for you": nothing is published
           by itself when the network comes back, the user does it here -->
      <section v-if="queue.pending.length" class="box pending-outings">
        <header class="pending-header">
          <span class="has-text-weight-semibold">
            <fa-icon icon="upload" />&nbsp;{{ $gettext('Outings waiting for you to publish them:') }}
            {{ queue.pending.length }}
          </span>
          <button
            v-if="offline.online"
            type="button"
            class="button is-small is-primary"
            :disabled="queue.syncing || !queue.ready.length"
            @click="queue.publish()"
          >
            <fa-icon icon="rotate" :spin="queue.syncing" />&nbsp;{{
              queue.syncing ? $gettext('Publishing…') : $gettext('Publish now')
            }}
          </button>
          <span v-else class="tag is-warning">{{ $gettext('Offline') }}</span>
        </header>

        <article v-for="item of queue.pending" :key="item.id" class="pending-outing">
          <p>
            <span class="has-text-weight-semibold">{{ item.title }}</span>
            &nbsp;
            <span v-if="item.needsRouteAssoc" class="tag is-warning is-light">{{ $gettext('Route to link') }}</span>
            <span v-else-if="item.conflict" class="tag is-warning is-light">
              {{ item.freezeReason === 'conflict' ? $gettext('Conflict') : $gettext('To check') }}
            </span>
            <span v-else-if="item.attempts" class="tag is-danger is-light">
              {{ $gettext('Attempts:') }} {{ item.attempts }}
            </span>
          </p>
          <!-- the note written in the mountains, to recognize the outing weeks later -->
          <p v-if="item.needsRouteAssoc && item.routeNote" class="is-size-7">
            <em>{{ item.routeNote }}</em>
          </p>
          <!-- the API's own words: a refused outing is fixed only if the user sees what was refused -->
          <p v-if="item.lastError" class="is-size-7 has-text-grey">
            {{ $gettext('Last error:') }} <code>{{ item.lastError }}</code>
          </p>
          <p v-if="item.conflict" class="is-size-7">{{ whyFrozen(item) }}</p>

          <div class="buttons are-small mt-2">
            <button
              v-if="item.needsRouteAssoc"
              type="button"
              class="button is-primary"
              @click="linking = linking === item.id ? null : item.id"
            >
              <fa-icon icon="link" />&nbsp;{{ $gettext('Link the route') }}
            </button>
            <button
              v-if="item.conflict"
              type="button"
              class="button is-primary"
              :disabled="queue.syncing"
              @click="retry(item)"
            >
              <fa-icon icon="rotate" />&nbsp;{{ $gettext('Try again') }}
            </button>
            <router-link
              class="button"
              :to="{ name: 'outing-add', params: { lang: $language.current }, query: { draft: item.id } }"
            >
              <fa-icon icon="edit" />&nbsp;{{ $gettext('Edit') }}
            </router-link>
            <button v-if="item.conflict" type="button" class="button" @click="queue.download(item)">
              <fa-icon icon="download" />&nbsp;{{ $gettext('Download') }}
            </button>
            <button type="button" class="button is-text" @click="giveUp(item)">{{ $gettext('Give up') }}</button>
          </div>

          <!-- its route: one saved offline, or a search with a network -->
          <div v-if="linking === item.id" class="route-link-panel">
            <button
              v-for="route of offlineRoutes"
              :key="route.id"
              type="button"
              class="button is-small is-fullwidth is-justify-content-flex-start"
              @click="link(item, route.data)"
            >
              <fa-icon icon="bookmark" />&nbsp;{{ route.title }}
            </button>
            <input-document v-if="offline.online" document-type="route" @add="link(item, $event)" />
            <p v-else-if="!offlineRoutes.length" class="is-size-7">
              {{ $gettext('No route saved offline: link it once the network is back.') }}
            </p>
          </div>
        </article>
      </section>

      <!-- two independent lists: the tab answers the one question that matters, does it open without a network -->
      <div class="tabs is-boxed is-fullwidth">
        <ul>
          <li v-for="tab of tabs" :key="tab.mode" :class="{ 'is-active': section === tab.mode }">
            <a @click="section = tab.mode">
              <fa-icon :icon="tab.icon" />&nbsp;{{ tab.label }}
              <span class="tag is-light ml-2">{{ entriesOf(tab.mode).length }}</span>
            </a>
          </li>
        </ul>
      </div>
      <p class="is-size-7 has-text-grey mb-3">
        {{
          section === OFFLINE_MODE
            ? $gettext('Saved on this device with their images and map: they open without a network.')
            : $gettext('Bookmarks on this device: they open with a network only.')
        }}
      </p>

      <div class="buttons">
        <button type="button" class="button is-small is-primary" @click="createFolder">
          <fa-icon icon="plus" />&nbsp;{{ $gettext('New folder') }}
        </button>
        <button v-if="entries.length" type="button" class="button is-small" @click="purge">
          <fa-icon icon="trash" />&nbsp;{{ $gettext('Remove all') }}
        </button>
      </div>

      <div v-if="!entries.length" class="has-text-centered empty-state">
        <fa-icon icon="bookmark" size="3x" class="has-text-grey-lighter" />
        <p class="title is-5 mt-4">
          {{ section === OFFLINE_MODE ? $gettext('No topo saved offline') : $gettext('No topo saved') }}
        </p>
        <p class="subtitle is-6 has-text-grey">
          {{
            section === OFFLINE_MODE
              ? $gettext('Save a topo of the Online tab offline to take it to the mountain.')
              : $gettext('Open a route, a waypoint or an outing, and tap the bookmark at the top.')
          }}
        </p>
        <router-link :to="{ name: 'routes' }" class="button is-primary">{{
          $gettext('Browse the topoguide')
        }}</router-link>
      </div>

      <template v-else>
        <section v-for="group of groups" :key="group.folder?.id ?? ''" class="offline-group">
          <header class="offline-group-header">
            <button type="button" class="offline-group-toggle" @click="toggleGroup(group.folder)">
              <fa-icon :icon="isCollapsed(group.folder) ? 'chevron-right' : 'chevron-down'" fixed-width />
              <fa-icon :icon="group.folder ? 'folder' : 'list'" class="has-text-primary" />
              <span class="offline-group-name">{{ group.folder?.name ?? $gettext('No folder') }}</span>
              <span class="tag is-light">{{ group.entries.length }}</span>
            </button>
            <template v-if="group.folder">
              <button
                type="button"
                class="button is-text is-small"
                :title="$gettext('Rename folder')"
                @click="renameFolder(group.folder)"
              >
                <fa-icon icon="edit" />
              </button>
              <button
                type="button"
                class="button is-text is-small"
                :title="$gettext('Delete folder')"
                @click="removeFolder(group.folder)"
              >
                <fa-icon icon="trash" />
              </button>
            </template>
          </header>

          <template v-if="!isCollapsed(group.folder)">
            <article v-for="entry of group.entries" :key="entry.type + entry.id" class="offline-card box">
              <router-link
                :to="{ name: entry.type, params: { id: entry.id, lang: entry.lang } }"
                class="offline-card-body"
              >
                <icon-document :document-type="entry.type" class="offline-card-icon" />
                <span class="offline-card-text">
                  <span class="offline-card-title">{{ entry.title }}</span>
                  <span v-if="entry.mode === OFFLINE_MODE" class="offline-card-meta">
                    <!-- not the same question: a copy downloaded a minute ago in a tunnel is recent and incomplete -->
                    <span v-if="!isDownloadComplete(entry)" class="tag is-warning is-light">
                      <fa-icon icon="triangle-exclamation" />&nbsp;{{ $gettext('Incomplete') }}
                    </span>
                    <span class="tag is-light" :class="FRESHNESS_CLASSES[freshnessOf(entry)]">
                      {{ $dateUtils.timeAgo(entry.downloadedAt!) }}
                    </span>
                  </span>
                </span>
              </router-link>
              <div class="offline-card-actions">
                <button
                  v-if="entry.mode !== OFFLINE_MODE"
                  type="button"
                  class="button is-small is-text"
                  :disabled="isBusy(entry)"
                  :title="$gettext('Save offline')"
                  @click="download(entry)"
                >
                  <fa-icon :icon="isBusy(entry) ? 'spinner' : 'download'" :spin="isBusy(entry)" />
                </button>
                <template v-else>
                  <!-- an old copy, or one the network cut: everything again, partial downloads are not tracked -->
                  <button
                    v-if="!isDownloadComplete(entry) || freshnessOf(entry) !== 'fresh'"
                    type="button"
                    class="button is-small is-text"
                    :disabled="isBusy(entry)"
                    :title="$gettext('Download again')"
                    @click="download(entry)"
                  >
                    <fa-icon icon="rotate" :spin="isBusy(entry)" />
                  </button>
                  <button
                    type="button"
                    class="button is-small is-text"
                    :title="$gettext('Back to online: frees the space, the topo no longer opens offline')"
                    @click="makeOnline(entry)"
                  >
                    <fa-icon icon="plug" />
                  </button>
                </template>
                <select
                  class="offline-card-select"
                  :value="entry.folderId ?? ''"
                  :title="$gettext('Move to folder')"
                  @change="moveToFolder(entry, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">{{ $gettext('No folder') }}</option>
                  <option v-for="folder of folders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
                </select>
                <button
                  type="button"
                  class="button is-small is-text"
                  :title="$gettext('Remove from My topos')"
                  @click="remove(entry)"
                >
                  <fa-icon icon="trash" />
                </button>
              </div>
            </article>
          </template>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { toast } from '@/js/toast';
import {
  freshnessOf,
  isDownloadComplete,
  OFFLINE_MODE,
  ONLINE_MODE,
  type Folder,
  type SavedEntry,
  type SavedMode,
} from '@/pwa/offline-store';
import type { PendingOuting } from '@/pwa/outing-queue';
import { useOfflineStore } from '@/stores/offline';
import { useOutingQueueStore } from '@/stores/outing-queue';

defineOptions({ name: 'OfflineView' });

const FRESHNESS_CLASSES: Record<string, string> = { stale: 'is-warning', 'very-stale': 'is-danger' };

const { $gettext, $language } = useGlobalProperties();
const offline = useOfflineStore();
const queue = useOutingQueueStore();

// the outing whose route is being linked
const linking = ref<string | null>(null);
const offlineRoutes = computed(() =>
  offline.savedDocs.filter((entry) => entry.type === 'route' && entry.mode === OFFLINE_MODE && entry.data)
);

async function link(item: PendingOuting, route: { document_id?: number }) {
  await queue.attachRoute(item.id, route);
  linking.value = null;
  notify($gettext('Route linked: the outing is ready to publish.'), 'is-success');
}

async function retry(item: PendingOuting) {
  await queue.retry(item.id);
  await queue.publish();
}

async function giveUp(item: PendingOuting) {
  if (window.confirm($gettext('Give up this outing? It will be lost.'))) {
    await queue.remove(item.id);
  }
}

// why an outing is no longer tried, and what to do. The ambiguous case matters most: it may be on the site already
function whyFrozen(item: PendingOuting) {
  if (item.freezeReason === 'conflict') {
    return $gettext('A linked document changed meanwhile. Check it before publishing again.');
  }
  if (item.freezeReason === 'invalid') {
    return $gettext('Camptocamp refused this outing (reason above). Fix it with Edit, then tap Try again.');
  }
  if (item.ambiguous) {
    return $gettext(
      'Impossible to know whether this outing was published: the connection was lost at the wrong moment. Check on Camptocamp before trying again, so as not to publish it twice.'
    );
  }
  return $gettext('Several attempts failed. Try again later, or give up the outing.');
}

// without a network, what opens without one
const section = ref<SavedMode>(offline.online ? ONLINE_MODE : OFFLINE_MODE);
const tabs = [
  { mode: ONLINE_MODE, icon: 'wifi', label: $gettext('Online') },
  { mode: OFFLINE_MODE, icon: 'circle-check', label: $gettext('Offline') },
] as const;

const entriesOf = (mode: SavedMode) =>
  offline.savedDocs.filter((entry) => entry.mode === mode).sort((a, b) => b.savedAt - a.savedAt);
const entries = computed(() => entriesOf(section.value));
const folders = computed(() => offline.foldersOf(section.value));

// the folders of the section, then what is in none
const groups = computed(() => {
  const result: { folder: Folder | null; entries: SavedEntry[] }[] = folders.value.map((folder) => ({
    folder,
    entries: entries.value.filter((entry) => entry.folderId === folder.id),
  }));
  const unfiled = entries.value.filter((entry) => !folders.value.some((folder) => folder.id === entry.folderId));
  if (unfiled.length || !result.length) {
    result.push({ folder: null, entries: unfiled });
  }
  return result;
});

const collapsed = ref(new Set<string>());
const groupKey = (folder: Folder | null) => section.value + ':' + (folder?.id ?? '');
const isCollapsed = (folder: Folder | null) => collapsed.value.has(groupKey(folder));
function toggleGroup(folder: Folder | null) {
  const key = groupKey(folder);
  if (!collapsed.value.delete(key)) {
    collapsed.value.add(key);
  }
}

// the space the site takes on the device (documents, images, tiles, the app itself)
const usage = ref('');
async function updateUsage() {
  const bytes = (await navigator.storage?.estimate?.())?.usage;
  usage.value = bytes
    ? new Intl.NumberFormat($language.current ?? undefined, {
        style: 'unit',
        unit: 'megabyte',
        maximumFractionDigits: 0,
      }).format(bytes / 1e6)
    : '';
}
onMounted(updateUsage);

const isBusy = (entry: SavedEntry) => offline.isDownloading(entry.type, entry.id);
const notify = (message: string, type: 'is-success' | 'is-warning') =>
  toast({ message, type, position: 'bottom-center', duration: 4500 });

async function download(entry: SavedEntry) {
  try {
    await offline.downloadForOffline(entry);
    notify($gettext('Saved offline'), 'is-success');
  } catch {
    notify($gettext('Download failed: check the network and try again'), 'is-warning');
  }
  await updateUsage();
}

async function makeOnline(entry: SavedEntry) {
  if (window.confirm($gettext('Back to online? The topo stays in My topos but no longer opens offline.'))) {
    await offline.makeOnline(entry.type, entry.id);
    await updateUsage();
  }
}

async function remove(entry: SavedEntry) {
  if (window.confirm($gettext('Remove this topo from My topos?'))) {
    await offline.removeDocument(entry.type, entry.id);
    await updateUsage();
  }
}

async function purge() {
  if (window.confirm($gettext('Remove all the topos of this tab from My topos?'))) {
    await offline.purge(section.value);
    await updateUsage();
  }
}

const moveToFolder = (entry: SavedEntry, folderId: string) =>
  offline.moveToFolder(entry.type, entry.id, folderId || null);

async function createFolder() {
  const name = window.prompt($gettext('Folder name'))?.trim();
  if (name) {
    await offline.createFolder(name, section.value);
  }
}

async function renameFolder(folder: Folder) {
  const name = window.prompt($gettext('Folder name'), folder.name)?.trim();
  if (name) {
    await offline.renameFolder(folder, name);
  }
}

async function removeFolder(folder: Folder) {
  if (window.confirm($gettext('Delete this folder? Its topos go back to No folder.'))) {
    await offline.removeFolder(folder.id);
  }
}
</script>

<style scoped>
.pending-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.pending-outing {
  padding: 0.75rem 0;
  border-top: 1px solid var(--c2c-grey-lighter);
}

.route-link-panel {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.offline-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 1rem;

  .title {
    margin-bottom: 0;
  }
}

.empty-state {
  padding: 2rem 0;
}

.offline-group {
  margin-bottom: 1rem;
}

.offline-group-header {
  display: flex;
  align-items: center;
}

.offline-group-toggle {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.offline-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.offline-card-body {
  display: flex;
  flex: 1 1 14rem;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  color: var(--c2c-text);
}

.offline-card-icon {
  flex-shrink: 0;
  color: var(--c2c-primary);
  font-size: 1.25rem;
}

.offline-card-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.offline-card-title {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.offline-card-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.offline-card-select {
  max-width: 8rem;
  padding: 0.25rem;
  border: 1px solid var(--c2c-grey-lighter);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 0.8rem;
}
</style>
