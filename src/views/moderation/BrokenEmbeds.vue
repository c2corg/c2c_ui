<template>
  <div>
    <p class="mb-4" v-translate>
      The images shown in the text of a document ([img=…] tag) that do not show: deleted, never existing, or another
      type of document. Those that can still be restored come first.
    </p>

    <div v-if="restored" class="notification is-success">
      <button class="delete" @click="restored = null" :aria-label="$gettext('Close')" />
      <span v-translate>Restored:</span>
      <router-link :to="documentRoute(restored.document_type, restored.document_id)">
        #{{ restored.document_id }}
      </router-link>
    </div>

    <div v-if="page.error" class="notification is-danger" v-translate>The broken images could not be loaded.</div>
    <p v-else-if="!page.loading && embeds.length === 0" class="has-text-grey" v-translate>No broken image.</p>
    <p v-else-if="!page.loading || embeds.length" class="has-text-grey is-size-7 mb-2">
      {{ $gettext('Found:') }} {{ total }}
    </p>

    <div v-for="embed of embeds" :key="embed.document_id + '-' + embed.image_id" class="box broken-embed">
      <div class="is-flex is-justify-content-space-between is-align-items-start">
        <div>
          <p>
            <icon-document :document-type="letterToDocumentType[embed.document_type]" fixed-width />
            <router-link :to="documentRoute(embed.document_type, embed.document_id, embed.langs[0])">
              {{ embed.title || '#' + embed.document_id }}
            </router-link>
            <span v-for="lang of embed.langs" :key="lang" class="tag is-light ml-1">{{ lang }}</span>
          </p>
          <p class="mt-1 is-size-7">
            <code>[img={{ embed.image_id }}]</code>
            <span class="tag ml-2" :class="REASON_CLASSES[embed.reason]">{{ reasonLabel(embed) }}</span>
            <template v-if="embed.reason === 'not_image' && embed.image_document_type">
              <span v-if="embed.image_id === embed.document_id" class="ml-2" v-translate>
                it is the id of this document itself
              </span>
              <template v-else>
                <span class="ml-2">{{ $gettext('it is the id of:') }}</span>
                <icon-document :document-type="letterToDocumentType[embed.image_document_type]" fixed-width />
                <router-link :to="documentRoute(embed.image_document_type, embed.image_id)"
                  >{{ $gettext(letterToDocumentType[embed.image_document_type]) }} #{{ embed.image_id }}</router-link
                ><span v-if="embed.image_document_title"> « {{ embed.image_document_title }} »</span>
              </template>
            </template>
          </p>
          <p v-if="embed.deleted" class="mt-1 is-size-7">
            <span v-translate>Deleted</span>
            <template v-if="embed.deleted.document_id !== embed.image_id">
              <span v-translate>with</span>
              <icon-document :document-type="letterToDocumentType[embed.deleted.document_type]" fixed-width />
              #{{ embed.deleted.document_id }}
            </template>
            <template v-if="embed.deleted.by">
              <span v-translate>by</span> <contributor-link :contributor="embed.deleted.by" />
            </template>
            {{ $dateUtils.toLocalizedString(embed.deleted.deleted_at, 'lll') }}
            <span class="has-text-grey"
              >· {{ $gettext('days left to restore it:') }} {{ daysLeft(embed.deleted.expires_at) }}</span
            >
          </p>
        </div>

        <div class="buttons is-flex-shrink-0 ml-3">
          <button v-if="embed.deleted" class="button is-primary" @click="confirmRestore(embed)">
            <fa-icon icon="history" class="mr-1" />
            <span v-translate>Restore</span>
          </button>
        </div>
      </div>
    </div>

    <div class="has-text-centered mt-4">
      <button
        v-if="embeds.length < total"
        class="button"
        :class="{ 'is-loading': page.loading }"
        @click="loadMore"
        v-translate
      >
        More
      </button>
      <span v-else-if="page.loading" class="button is-loading is-white" />
    </div>

    <!-- a restore destroys nothing: not the red and green of the deletions -->
    <modal-confirmation
      ref="confirmation"
      :promise="restoring"
      confirm-class="is-primary"
      cancel-class=""
      @confirm="restore"
    >
      <template #title>
        <span v-translate>Restore the image</span>
      </template>
      <template v-if="toRestore?.deleted">
        <p v-if="toRestore.deleted.document_id === toRestore.image_id" v-translate>
          The image comes back with its history and links, as it was when deleted.
        </p>
        <p v-else>
          {{ $gettext('The image was deleted with another document; both come back, as they were when deleted:') }}
          <icon-document :document-type="letterToDocumentType[toRestore.deleted.document_type]" fixed-width />
          #{{ toRestore.deleted.document_id }}
        </p>
      </template>
      <template #confirm-label>
        <span v-translate>Restore</span>
      </template>
    </modal-confirmation>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, useTemplateRef } from 'vue';

import { daysLeft, documentRoute } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { BrokenEmbed } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';

const PAGE_SIZE = 30;

// red: restorable, before its purge; grey: gone, only an edit of the text helps; orange: a wrong id in the text
const REASON_CLASSES: Record<BrokenEmbed['reason'], string> = {
  deleted: 'is-danger is-light',
  missing: '',
  not_image: 'is-warning is-light',
};

const { $gettext } = useGlobalProperties();
const { letterToDocumentType } = constants;

const embeds = ref<BrokenEmbed[]>([]);
const total = ref(0);
const page = shallowRef<ApiData>(load(0));

const confirmation = useTemplateRef<{ show: () => void; hide: () => void }>('confirmation');
const toRestore = ref<BrokenEmbed | null>(null);
const restoring = shallowRef<ApiData | null>(null);
const restored = ref<{ document_id: number; document_type: string } | null>(null);

function reasonLabel(embed: BrokenEmbed): string {
  switch (embed.reason) {
    case 'deleted':
      return $gettext('Deleted image');
    case 'missing':
      return $gettext('No such image');
    default:
      return $gettext('Not an image');
  }
}

function load(offset: number): ApiData {
  return c2c.moderator.getBrokenEmbeds(offset, PAGE_SIZE).then((response) => {
    // a restore meanwhile shifts the pages: no embed twice
    const key = (embed: BrokenEmbed) => embed.document_id + '-' + embed.image_id;
    const known = new Set(embeds.value.map(key));
    embeds.value.push(...response.data.embeds.filter((embed) => !known.has(key(embed))));
    total.value = response.data.total;
  });
}

function reload() {
  embeds.value = [];
  total.value = 0;
  page.value = load(0);
}

function loadMore() {
  page.value = load(embeds.value.length);
}

function confirmRestore(embed: BrokenEmbed) {
  toRestore.value = embed;
  confirmation.value!.show();
}

function restore() {
  const deleted = toRestore.value?.deleted;
  if (!deleted) {
    return;
  }
  restoring.value = c2c.moderator.restoreDeletedDocument(deleted.entry_id).then(() => {
    confirmation.value!.hide();
    restored.value = { document_id: deleted.document_id, document_type: deleted.document_type };
    reload();
  });
}
</script>
