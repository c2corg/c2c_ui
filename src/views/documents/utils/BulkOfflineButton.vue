<template>
  <dropdown-button ref="menu" :disabled="busy || !documents.length" class="is-right">
    <template #button>
      <span class="button is-small" :title="$gettext('Save the page in My topos')">
        <fa-icon :icon="busy ? 'spinner' : 'bookmark'" :spin="busy" />
        <span v-if="busy || !$screen.isMobile">
          &nbsp;{{ busy ? done + '/' + documents.length : $gettext('Save the page') }}
        </span>
      </span>
    </template>
    <p class="dropdown-item is-size-7 has-text-grey bulk-offline-note">
      {{ $gettext('Saved online: from My topos, save offline the ones you take to the mountain.') }}
    </p>
    <hr class="dropdown-divider" />
    <a class="dropdown-item" @click="save(null)">{{ $gettext('No folder') }}</a>
    <a v-for="folder of offline.foldersOf(ONLINE_MODE)" :key="folder.id" class="dropdown-item" @click="save(folder.id)">
      <fa-icon icon="folder" />&nbsp;{{ folder.name }}
    </a>
    <a class="dropdown-item" @click="saveInNewFolder"> <fa-icon icon="plus" />&nbsp;{{ $gettext('New folder') }} </a>
  </dropdown-button>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { ONLINE_MODE } from '@/pwa/offline-store';
import { useOfflineStore } from '@/stores/offline';

// the documents of the page of a listing, bookmarked in "My topos" at once
const props = defineProps<{ documents: C2cDocument[]; documentType: string }>();

const { $gettext, $documentUtils, $language } = useGlobalProperties();
const offline = useOfflineStore();
const menu = useTemplateRef<{ isActive: boolean }>('menu');

const busy = ref(false);
const done = ref(0);

async function save(folderId: string | null) {
  menu.value!.isActive = false;
  busy.value = true;
  done.value = 0;
  const lang = $language.current!;
  for (const document of props.documents) {
    // one that fails does not stop the others
    await offline
      .saveDocument({
        type: props.documentType,
        id: document.document_id!,
        lang,
        title: $documentUtils.getDocumentTitle(document, lang),
        folderId,
      })
      .catch(() => {});
    done.value++;
  }
  busy.value = false;
}

async function saveInNewFolder() {
  const name = window.prompt($gettext('Folder name'))?.trim();
  if (name) {
    await save(await offline.createFolder(name, ONLINE_MODE));
  }
}
</script>

<style scoped>
.bulk-offline-note {
  max-width: 18rem;
  white-space: normal;
}
</style>
