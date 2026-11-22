<template>
  <section class="section favourites-view">
    <html-header :title="$gettext('Favourites')" />
    <div class="container">
      <header class="favourites-header">
        <h1 class="title is-4">{{ $gettext('Favourites') }}</h1>
        <button
          type="button"
          class="button is-text new-folder"
          :title="$gettext('New folder')"
          :aria-label="$gettext('New folder')"
          @click="createFolder"
        >
          <fa-icon icon="folder-plus" />
        </button>
      </header>
      <p class="is-size-7 has-text-grey status-line">{{ statusLine }}</p>

      <!-- logged out: favourites on this device only, which a browser may clear -->
      <div v-if="!favourites.isLogged" class="box device-only">
        <p>
          {{ $gettext('Saved on this device only.') }}
          {{ $gettext('Create an account to find your favourites on all your devices.') }}
          <template v-if="iosBrowser">
            {{ $gettext('On iPhone, also install the app: Safari clears the data of a site not opened for 7 days.') }}
          </template>
        </p>
        <div class="buttons mt-3">
          <router-link
            :to="{ name: 'auth', query: { signup: null, redirect: $route.fullPath } }"
            class="button is-primary is-small"
          >
            {{ $gettext('Create an account') }}
          </router-link>
          <router-link :to="{ name: 'auth', query: { redirect: $route.fullPath } }" class="button is-small">
            {{ $gettext('Log in') }}
          </router-link>
        </div>
      </div>

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

      <!-- one list, one set of folders: the filter answers the one question that matters, does it open without a network -->
      <div class="buttons filter-chips">
        <button
          type="button"
          class="button is-small is-rounded"
          :class="{ 'is-primary': filter === 'all' }"
          :aria-pressed="filter === 'all'"
          @click="filter = 'all'"
        >
          {{ $gettext('All') }}&nbsp;<span class="chip-count">{{ rows.length }}</span>
        </button>
        <button
          type="button"
          class="button is-small is-rounded"
          :class="{ 'is-primary': filter === 'offline' }"
          :aria-pressed="filter === 'offline'"
          @click="filter = 'offline'"
        >
          <fa-icon icon="arrow-down" />&nbsp;{{ $gettext('Offline') }}&nbsp;<span class="chip-count">{{
            offlineRows.length
          }}</span>
        </button>
      </div>

      <div v-if="!shown.length && !needNetwork.length" class="has-text-centered empty-state">
        <fa-icon icon="bookmark" size="3x" class="has-text-grey-lighter" />
        <p class="title is-5 mt-4">
          {{ filter === 'offline' ? $gettext('No topo saved offline') : $gettext('No favourite yet') }}
        </p>
        <p class="subtitle is-6 has-text-grey">
          {{
            filter === 'offline'
              ? $gettext('Tap the download button of a favourite to take it to the mountain.')
              : $gettext('Open a route, a waypoint or an outing, and tap the bookmark at the top.')
          }}
        </p>
        <router-link :to="{ name: 'routes' }" class="button is-primary">{{
          $gettext('Browse the topoguide')
        }}</router-link>
      </div>

      <template v-else>
        <section v-for="group of groups" :key="group.folder?.id ?? ''" class="favourites-group">
          <header class="favourites-group-header">
            <button type="button" class="favourites-group-toggle" @click="toggleGroup(group.folder)">
              <fa-icon :icon="isCollapsed(group.folder) ? 'chevron-right' : 'chevron-down'" fixed-width />
              <fa-icon :icon="group.folder ? 'folder' : 'list'" class="has-text-primary" />
              <span class="favourites-group-name">{{ group.folder?.name ?? $gettext('No folder') }}</span>
              <span class="tag is-light">{{ group.rows.length }}</span>
              <!-- a pack of the day with a topo to download again: seen before leaving -->
              <span
                v-if="attentionCount(group.rows)"
                class="tag is-warning is-light"
                :title="$gettext('Topos to download again')"
              >
                <fa-icon icon="triangle-exclamation" />&nbsp;{{ attentionCount(group.rows) }}
              </span>
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
            <favourite-card
              v-for="row of group.rows"
              :key="row.favourite.type + row.favourite.id"
              :row="row"
              @download="download(row)"
              @actions="actionsOf = row"
            />
          </template>
        </section>

        <!-- without a network: the favourites that do not open, out of the way -->
        <section v-if="needNetwork.length" class="favourites-group need-network">
          <header class="favourites-group-header">
            <button type="button" class="favourites-group-toggle" @click="needNetworkOpen = !needNetworkOpen">
              <fa-icon :icon="needNetworkOpen ? 'chevron-down' : 'chevron-right'" fixed-width />
              <fa-icon icon="wifi" />
              <span class="favourites-group-name">{{ $gettext('Need a network') }} ({{ needNetwork.length }})</span>
            </button>
          </header>
          <template v-if="needNetworkOpen">
            <favourite-card
              v-for="row of needNetwork"
              :key="row.favourite.type + row.favourite.id"
              :row="row"
              @download="download(row)"
              @actions="actionsOf = row"
            />
          </template>
        </section>
      </template>

      <div v-if="filter === 'offline' && offlineRows.length" class="remove-all-offline">
        <button type="button" class="button is-small" @click="removeAllOfflineCopies">
          <fa-icon icon="trash" />&nbsp;{{ $gettext('Remove all offline copies') }} ({{ formatSize(offlineBytes) }})
        </button>
        <p class="is-size-7 has-text-grey mt-1">{{ $gettext('They stay in your favourites.') }}</p>
      </div>

      <!-- a shared computer: the copies of the other people only take space, their titles are theirs -->
      <div v-if="favourites.othersCopies.length" class="remove-all-offline">
        <p class="is-size-7 has-text-grey">
          {{ $gettext('Offline copies of other people on this device') }}: {{ favourites.othersCopies.length }} ({{
            formatSize(othersBytes)
          }})
        </p>
        <button type="button" class="button is-small mt-1" @click="removeOthersCopies">
          <fa-icon icon="trash" />&nbsp;{{ $gettext('Free this space') }}
        </button>
      </div>
    </div>

    <!-- the actions of one favourite -->
    <modal-card ref="actionsModal" @hide="actionsOf = null">
      <template #title>{{ actionsOf?.favourite.title }}</template>
      <template v-if="actionsOf">
        <div class="field">
          <label class="label is-small" for="favourite-folder">{{ $gettext('Folder') }}</label>
          <div class="select is-small is-fullwidth">
            <select
              id="favourite-folder"
              :value="actionsOf.favourite.folderId ?? ''"
              @change="moveTo(actionsOf, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ $gettext('No folder') }}</option>
              <option v-for="folder of favourites.folders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="buttons favourite-actions">
          <button
            type="button"
            class="button is-fullwidth"
            :disabled="!offline.online || isBusy(actionsOf)"
            @click="download(actionsOf, true)"
          >
            <fa-icon :icon="actionsOf.entry ? 'rotate' : 'download'" />&nbsp;{{
              actionsOf.entry ? $gettext('Download again') : $gettext('Save offline')
            }}
          </button>
          <button
            v-if="actionsOf.entry"
            type="button"
            class="button is-fullwidth"
            @click="removeOfflineCopy(actionsOf)"
          >
            <fa-icon icon="trash" />&nbsp;{{ $gettext('Remove the offline copy') }}
            <template v-if="actionsOf.entry.assets?.bytes">
              ({{ $gettext('frees') }} {{ formatSize(actionsOf.entry.assets.bytes) }})
            </template>
          </button>
          <button type="button" class="button is-fullwidth is-danger is-outlined" @click="remove(actionsOf)">
            <fa-icon icon="bookmark" />&nbsp;{{ $gettext('Remove from favourites') }}
          </button>
        </div>
      </template>
      <template #footer>
        <button type="button" class="button" @click="actionsModal?.hide()">{{ $gettext('Close') }}</button>
      </template>
    </modal-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import FavouriteCard from './FavouriteCard.vue';
import { copyStateOf, formatSize, groupsOf, rowsOf, type FavouriteRow } from './favourite-rows';

import ModalCard from '@/components/generics/modals/ModalCard.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { usePullRefresh } from '@/js/composables/pull-refresh';
import { notify, notifyWithAction, toast } from '@/js/toast';
import install, { devicePlatform } from '@/pwa/install';
import type { PendingOuting } from '@/pwa/outing-queue';
import { useFavouritesStore, type FavouriteFolder } from '@/stores/favourites';
import { useOfflineStore } from '@/stores/offline';
import { useOutingQueueStore } from '@/stores/outing-queue';

defineOptions({ name: 'FavouritesView' });

const { $gettext, $language } = useGlobalProperties();

const favourites = useFavouritesStore();
const offline = useOfflineStore();
const queue = useOutingQueueStore();
// what another tab or device changed meanwhile
usePullRefresh(() => Promise.all([favourites.refresh().catch(() => {}), queue.refresh()]));

// the outing whose route is being linked
const linking = ref<string | null>(null);
const offlineRoutes = computed(() =>
  offline.savedDocs.filter((entry) => entry.type === 'route' && entry.mode === 'offline' && entry.data)
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

// Safari on iOS clears the data of a site not opened for 7 days, unless it is installed
const iosBrowser = computed(() => devicePlatform() === 'ios' && !install.installed);

const rows = computed(() => rowsOf(favourites.favourites, favourites.copyOf));
const offlineRows = computed(() => rows.value.filter((row) => row.entry));
const offlineBytes = computed(() =>
  offlineRows.value.reduce((total, row) => total + (row.entry?.assets?.bytes ?? 0), 0)
);

const othersBytes = computed(() =>
  favourites.othersCopies.reduce((total, entry) => total + (entry.assets?.bytes ?? 0), 0)
);

const statusLine = computed(() => {
  if (!favourites.isLogged) {
    return $gettext('On this device only');
  }
  if (!offline.online) {
    return $gettext('Changes sync when the network is back');
  }
  const synced = $gettext('Synced with your account');
  return offlineBytes.value
    ? `${synced} · ${formatSize(offlineBytes.value, $language.current)} ${$gettext('offline on this device')}`
    : synced;
});

// without a network, what opens without one; and from the reminder of the topos to download again (?tab=offline)
const filter = ref<'all' | 'offline'>(!offline.online || useRoute().query['tab'] === 'offline' ? 'offline' : 'all');
watch(
  () => offline.online,
  (online) => {
    if (!online) {
      filter.value = 'offline';
    }
  }
);
const shown = computed(() => (filter.value === 'offline' ? offlineRows.value : rows.value));
// without a network, in the Offline filter: the favourites that do not open, in a folded group
const needNetwork = computed(() =>
  filter.value === 'offline' && !offline.online ? rows.value.filter((row) => !row.entry) : []
);
const needNetworkOpen = ref(false);
const groups = computed(() => groupsOf(shown.value, favourites.folders, filter.value === 'all'));

const collapsed = ref(new Set<string>());
const isCollapsed = (folder: FavouriteFolder | null) => collapsed.value.has(folder?.id ?? '');
function toggleGroup(folder: FavouriteFolder | null) {
  const key = folder?.id ?? '';
  if (!collapsed.value.delete(key)) {
    collapsed.value.add(key);
  }
}
const attentionCount = (groupRows: FavouriteRow[]) =>
  groupRows.filter((row) => ['old', 'incomplete'].includes(copyStateOf(row.entry) ?? '')).length;

onMounted(() => {
  // files the browser may have cleared since the start of the app
  void offline.checkAssets();
});

const failed = () => toast({ message: $gettext('An error occurred, please try again'), type: 'is-danger' });
const needsNetwork = () => notify($gettext('This needs a network: try again once online.'), 'is-warning');

// the actions of one favourite, in a dialog
const actionsModal = useTemplateRef<InstanceType<typeof ModalCard>>('actionsModal');
const actionsOf = ref<FavouriteRow | null>(null);
watch(actionsOf, (row) => {
  if (row) {
    actionsModal.value?.show();
  }
});
function closeActions() {
  actionsModal.value?.hide();
  actionsOf.value = null;
}

const isBusy = (row: FavouriteRow) => offline.isDownloading(row.favourite.type, row.favourite.id);
const docOf = (row: FavouriteRow) => ({
  type: row.favourite.type,
  id: row.favourite.id,
  title: row.favourite.title,
  lang: row.favourite.lang ?? $language.current ?? 'fr',
});

async function download(row: FavouriteRow, fromActions = false) {
  if (fromActions) {
    closeActions();
  }
  try {
    await favourites.saveOffline(docOf(row));
    notify($gettext('Saved offline'), 'is-success');
  } catch {
    notify($gettext('Download failed: check the network and try again'), 'is-warning');
  }
}

async function moveTo(row: FavouriteRow, folderId: string) {
  closeActions();
  await favourites.move(row.favourite.type, row.favourite.id, folderId || null).catch(failed);
}

async function removeOfflineCopy(row: FavouriteRow) {
  closeActions();
  await favourites.removeOfflineCopy(row.favourite.type, row.favourite.id).catch(failed);
}

async function remove(row: FavouriteRow) {
  closeActions();
  const { type, id, folderId } = row.favourite;
  // its offline copy goes too, which an undo would not bring back
  if (row.entry && !window.confirm($gettext('Remove from favourites? Its offline copy is removed too.'))) {
    return;
  }
  try {
    await favourites.remove(type, id);
  } catch {
    return failed();
  }
  if (!row.entry) {
    notifyWithAction($gettext('Removed from favourites.'), $gettext('Undo'), () =>
      favourites.add(docOf(row), folderId).catch(failed)
    );
  }
}

async function removeOthersCopies() {
  if (
    window.confirm($gettext('Remove the offline copies of the other people? They will have to download them again.'))
  ) {
    await favourites.removeOthersCopies().catch(failed);
  }
}

async function removeAllOfflineCopies() {
  if (window.confirm($gettext('Remove all offline copies? They stay in your favourites.'))) {
    await favourites.removeAllOfflineCopies().catch(failed);
  }
}

// the folders of the account need a network
const folderAction = async (action: () => Promise<unknown>) => {
  if (favourites.isLogged && !offline.online) {
    return needsNetwork();
  }
  await action().catch(failed);
};

async function createFolder() {
  const name = window.prompt($gettext('Folder name'))?.trim();
  if (name) {
    await folderAction(() => favourites.createFolder(name));
  }
}

async function renameFolder(folder: FavouriteFolder) {
  const name = window.prompt($gettext('Folder name'), folder.name)?.trim();
  if (name && name !== folder.name) {
    await folderAction(() => favourites.renameFolder(folder.id, name));
  }
}

async function removeFolder(folder: FavouriteFolder) {
  if (window.confirm($gettext('Delete this folder? Its favourites go back to No folder.'))) {
    await folderAction(() => favourites.removeFolder(folder.id));
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

.favourites-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  .title {
    margin-bottom: 0;
  }

  .new-folder {
    font-size: 1.25rem;
  }
}

.status-line {
  margin-bottom: 1rem;
}

.filter-chips .chip-count {
  opacity: 0.75;
}

.empty-state {
  padding: 2rem 0;
}

.favourites-group {
  margin-bottom: 1rem;
}

.favourites-group-header {
  display: flex;
  align-items: center;
}

.favourites-group-toggle {
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

/* they do not open without a network */
.need-network {
  opacity: 0.55;
}

.remove-all-offline {
  margin-top: 1.5rem;
}

.favourite-actions {
  flex-direction: column;
  align-items: stretch;
}
</style>
