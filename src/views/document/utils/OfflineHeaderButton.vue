<template>
  <span class="offline-header-button" :title="label" @click="toggle">
    <fa-icon v-if="busy" icon="spinner" spin />
    <fa-icon v-else icon="bookmark" :class="entry ? 'has-text-primary' : 'has-text-grey-light'" />
    <!-- the one sign that the page opens without a network, read before walking out of coverage: not subtle -->
    <span v-if="entry?.mode === OFFLINE_MODE" class="offline-dot" :class="'is-' + freshnessOf(entry)" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { toast } from '@/js/toast';
import { freshnessOf, OFFLINE_MODE, type SavedMode } from '@/pwa/offline-store';
import { useOfflineStore } from '@/stores/offline';

// the document of the page, saved in "My topos" in the language it is shown in
const props = defineProps<{ documentType: string; documentId: number; lang: string; title: string }>();

const { $gettext } = useGlobalProperties();
const offline = useOfflineStore();

const entry = computed(() => offline.find(props.documentType, props.documentId));
const busy = computed(() => offline.isDownloading(props.documentType, props.documentId));

const label = computed(() => {
  if (busy.value) {
    return $gettext('Saving…');
  }
  if (!entry.value) {
    return $gettext('Save in My topos');
  }
  if (entry.value.mode !== OFFLINE_MODE) {
    return $gettext('Saved in My topos, not available offline');
  }
  return freshnessOf(entry.value) === 'fresh'
    ? $gettext('Saved offline')
    : $gettext('Saved offline, an old copy: download it again from My topos');
});

const save = (mode: SavedMode) =>
  offline.saveDocument({ type: props.documentType, id: props.documentId, lang: props.lang, title: props.title, mode });

const notify = (message: string | HTMLElement, type: 'is-info' | 'is-success' | 'is-warning') =>
  toast({ message, type, position: 'bottom-center', duration: 8000, dismissible: true, closeOnClick: false });

// saving is light, a bookmark; taking the topo to the mountain is a second, explicit step, offered right away
function offerOffline() {
  const message = document.createElement('div');
  message.textContent = $gettext('Saved in My topos. Without a network, it opens once saved offline.') + ' ';
  const button = document.createElement('button');
  button.className = 'button is-small is-white';
  button.textContent = $gettext('Save offline');
  button.addEventListener(
    'click',
    () => {
      button.disabled = true;
      save(OFFLINE_MODE).then(
        () => notify($gettext('Saved offline'), 'is-success'),
        () => notify($gettext('Download failed: check the network and try again'), 'is-warning')
      );
    },
    { once: true }
  );
  message.append(button);
  notify(message, 'is-info');
}

async function toggle() {
  if (busy.value) {
    return;
  }
  if (!entry.value) {
    await save('online').then(offerOffline, () =>
      notify($gettext('Download failed: check the network and try again'), 'is-warning')
    );
  } else if (window.confirm($gettext('Remove this topo from My topos?'))) {
    await offline.removeDocument(props.documentType, props.documentId);
  }
}
</script>

<style scoped>
.offline-header-button {
  position: relative;
}

.offline-dot {
  position: absolute;
  right: -2px;
  bottom: 2px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--c2c-white);
  border-radius: 50%;
  background: var(--c2c-green);

  &.is-stale {
    background: var(--c2c-yellow);
  }

  &.is-very-stale {
    background: var(--c2c-danger);
  }
}
</style>
