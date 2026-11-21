<template>
  <span class="favourite-button" role="button" :title="label" :aria-label="label" @click="tap">
    <fa-icon icon="bookmark" :class="favourite ? 'has-text-primary' : 'has-text-grey-light'" />
    <!-- the one sign that the page opens without a network, read before walking out of coverage -->
    <span v-if="busy" class="offline-badge is-busy">
      <fa-icon icon="spinner" spin />
    </span>
    <span v-else-if="offlineEntry" class="offline-badge" :class="'is-' + badge">
      <fa-icon icon="arrow-down" />
    </span>
  </span>

  <!-- outside of the button: a click in the dialog must not tap it again -->
  <teleport to="body">
    <modal-card ref="dialog">
      <template #title>{{ $gettext('This topo is saved offline') }}</template>
      <div class="buttons favourite-choices">
        <button type="button" class="button is-fullwidth" @click="keepFavourite">
          {{ $gettext('Keep as favourite, remove the offline copy') }}
        </button>
        <button type="button" class="button is-fullwidth is-danger is-outlined" @click="removeBoth">
          {{ $gettext('Remove from favourites') }}
        </button>
      </div>
      <template #footer>
        <button type="button" class="button" @click="dialog?.hide()">{{ $gettext('Cancel') }}</button>
      </template>
    </modal-card>
  </teleport>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import ModalCard from '@/components/generics/modals/ModalCard.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { notify, notifyWithAction, toast } from '@/js/toast';
import { isOfflineEntry } from '@/pwa/offline-store';
import { useFavouritesStore } from '@/stores/favourites';
import { useOfflineStore } from '@/stores/offline';
import { copyStateOf } from '@/views/user/favourite-rows';

// the document of the page, kept in the language it is shown in
const props = defineProps<{ documentType: string; documentId: number; lang: string; title: string }>();

const { $gettext } = useGlobalProperties();
const favourites = useFavouritesStore();
const offline = useOfflineStore();
const dialog = useTemplateRef<InstanceType<typeof ModalCard>>('dialog');

const doc = computed(() => ({ type: props.documentType, id: props.documentId, lang: props.lang, title: props.title }));
const favourite = computed(() => favourites.isFavourite(props.documentType, props.documentId));
const busy = computed(() => offline.isDownloading(props.documentType, props.documentId));
const offlineEntry = computed(() => {
  const entry = offline.find(props.documentType, props.documentId);
  return isOfflineEntry(entry) ? entry : null;
});

// the colour of the badge: fresh, an old copy, or one that may not open fully without a network
const badge = computed(() => copyStateOf(offlineEntry.value));

const label = computed(() => {
  if (busy.value) {
    return $gettext('Saving offline…');
  }
  if (!favourite.value) {
    return $gettext('Add to favourites');
  }
  switch (badge.value) {
    case 'incomplete':
      return $gettext('In favourites, saved offline: incomplete, download it again from Favourites');
    case 'old':
      return $gettext('In favourites, saved offline: an old copy, download it again from Favourites');
    case 'fresh':
      return $gettext('In favourites, saved offline');
    default:
      return $gettext('Remove from favourites');
  }
});

const failed = () => toast({ message: $gettext('An error occurred, please try again'), type: 'is-danger' });

function saveOffline() {
  favourites.saveOffline(doc.value).then(
    () => notify($gettext('Saved offline'), 'is-success'),
    () => notify($gettext('Download failed: check the network and try again'), 'is-warning')
  );
}

async function add() {
  try {
    await favourites.add(doc.value);
  } catch {
    return failed();
  }
  const text = favourites.isLogged
    ? $gettext('Added to favourites.')
    : $gettext('Added to favourites.') + ' ' + $gettext('Saved on this device only.');
  // taking the topo to the mountain is a second, explicit step, offered right away
  notifyWithAction(text, $gettext('Also save offline'), saveOffline);
}

async function remove() {
  const folderId = favourites.find(props.documentType, props.documentId)?.folderId ?? null;
  try {
    await favourites.remove(props.documentType, props.documentId);
  } catch {
    return failed();
  }
  notifyWithAction($gettext('Removed from favourites.'), $gettext('Undo'), () =>
    favourites.add(doc.value, folderId).catch(failed)
  );
}

async function tap() {
  if (busy.value) {
    return;
  }
  if (!favourite.value) {
    await add();
  } else if (offlineEntry.value) {
    dialog.value?.show();
  } else {
    await remove();
  }
}

async function keepFavourite() {
  dialog.value?.hide();
  await favourites.removeOfflineCopy(props.documentType, props.documentId).catch(failed);
  notify($gettext('Offline copy removed. The topo stays in your favourites.'), 'is-info');
}

async function removeBoth() {
  dialog.value?.hide();
  await remove();
}

defineExpose({ tap });
</script>

<style scoped>
.favourite-button {
  position: relative;
  display: inline-block;
}

/* bottom right of the bookmark: a white arrow on the colour of the state of the copy. Under .favourite-button, to
   win over the fixed width the header gives every icon (DocumentViewHeader.vue) */
.favourite-button .offline-badge {
  position: absolute;
  right: -0.05em;
  bottom: -0.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.62em;
  height: 0.62em;
  border: 1.5px solid var(--c2c-white);
  border-radius: 50%;
  background: var(--c2c-green);
  color: var(--c2c-white);
  font-size: 1em;

  & :deep(svg) {
    width: 0.38em;
    height: 0.38em;
  }

  &.is-old {
    background: var(--c2c-yellow);
  }

  &.is-incomplete {
    background: var(--c2c-danger);
  }

  &.is-busy {
    background: var(--c2c-grey);
  }
}

.favourite-choices {
  flex-direction: column;
}
</style>
