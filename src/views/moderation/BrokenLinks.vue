<template>
  <div>
    <p class="mb-4" v-translate>
      The links in the texts of the collaborative documents ([[type/id|…]] or an address of the site) that are wrong: to
      a deleted or never existing document (they lead nowhere), or with a wrong or old type (they lead to the document
      all the same, to correct). Those that can still be restored come first.
    </p>

    <div v-if="restored" class="notification is-success">
      <button class="delete" @click="restored = null" :aria-label="$gettext('Close')" />
      <span v-translate>Restored:</span>
      <router-link :to="documentRoute(restored.document_type, restored.document_id)">
        #{{ restored.document_id }}
      </router-link>
    </div>

    <div v-if="page.error" class="notification is-danger" v-translate>The broken links could not be loaded.</div>
    <p v-else-if="!page.loading && links.length === 0" class="has-text-grey" v-translate>No broken link.</p>
    <p v-else-if="!page.loading || links.length" class="has-text-grey is-size-7 mb-2">
      {{ $gettext('Found:') }} {{ total }}
    </p>

    <div v-for="link of links" :key="key(link)" class="box broken-link">
      <div class="is-flex is-justify-content-space-between is-align-items-start">
        <div>
          <p>
            <icon-document :document-type="letterToDocumentType[link.document_type]" fixed-width />
            <router-link :to="documentRoute(link.document_type, link.document_id, link.langs[0])">
              {{ link.title || '#' + link.document_id }}
            </router-link>
            <span v-for="lang of link.langs" :key="lang" class="tag is-light ml-1">{{ lang }}</span>
          </p>
          <p class="mt-1 is-size-7">
            <code>{{ written(link) }}</code>
            <span class="tag ml-2" :class="REASON_CLASSES[link.reason]">{{ reasonLabel(link.reason) }}</span>
            <template v-if="link.target_document_type">
              <span class="ml-2">{{ $gettext('it is the id of:') }}</span>
              <icon-document :document-type="letterToDocumentType[link.target_document_type]" fixed-width />
              <router-link :to="documentRoute(link.target_document_type, link.target_id)"
                >{{ $gettext(letterToDocumentType[link.target_document_type]) }} #{{ link.target_id }}</router-link
              ><span v-if="link.target_document_title"> « {{ link.target_document_title }} »</span>
            </template>
          </p>
          <p v-if="link.target_document_type" class="mt-1 is-size-7">
            <span v-translate>To write instead:</span> <code>{{ corrected(link) }}</code>
          </p>
          <p v-if="link.deleted" class="mt-1 is-size-7">
            <span v-translate>Deleted</span>
            <template v-if="link.deleted.document_id !== link.target_id">
              <span v-translate>with</span>
              <icon-document :document-type="letterToDocumentType[link.deleted.document_type]" fixed-width />
              #{{ link.deleted.document_id }}
            </template>
            <template v-if="link.deleted.by">
              <span v-translate>by</span> <contributor-link :contributor="link.deleted.by" />
            </template>
            {{ $dateUtils.toLocalizedString(link.deleted.deleted_at, 'lll') }}
            <span class="has-text-grey"
              >· {{ $gettext('days left to restore it:') }} {{ daysLeft(link.deleted.expires_at) }}</span
            >
          </p>
        </div>

        <div class="buttons is-flex-shrink-0 ml-3">
          <button v-if="link.deleted" class="button is-primary" @click="confirmRestore(link)">
            <fa-icon icon="history" class="mr-1" />
            <span v-translate>Restore</span>
          </button>
        </div>
      </div>
    </div>

    <div class="has-text-centered mt-4">
      <button
        v-if="links.length < total"
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
        <span v-translate>Restore the document</span>
      </template>
      <template v-if="toRestore?.deleted">
        <p v-if="toRestore.deleted.document_id === toRestore.target_id" v-translate>
          The document comes back with its history and links, as it was when deleted.
        </p>
        <p v-else>
          {{ $gettext('The document was deleted with another one; both come back, as they were when deleted:') }}
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
import type { BrokenLink } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';

const PAGE_SIZE = 30;

// red: the link leads nowhere (the Restore button tells the deleted ones); yellow: the type in the text is wrong or
// old, the API leads the link to the document of its id all the same
const REASON_CLASSES: Record<BrokenLink['reason'], string> = {
  deleted: 'is-danger is-light',
  missing: 'is-danger is-light',
  wrong_type: 'is-warning is-light',
  unknown_type: 'is-warning is-light',
};

const { $gettext } = useGlobalProperties();
const { letterToDocumentType } = constants;

const links = ref<BrokenLink[]>([]);
const total = ref(0);
const page = shallowRef<ApiData>(load(0));

const confirmation = useTemplateRef<{ show: () => void; hide: () => void }>('confirmation');
const toRestore = ref<BrokenLink | null>(null);
const restoring = shallowRef<ApiData | null>(null);
const restored = ref<{ document_id: number; document_type: string } | null>(null);

const key = (link: BrokenLink) => `${link.document_id}-${link.target_type}-${link.target_id}-${link.is_url}`;

function reasonLabel(reason: BrokenLink['reason']): string {
  switch (reason) {
    case 'deleted':
      return $gettext('Deleted document');
    case 'missing':
      return $gettext('No such document');
    case 'wrong_type':
      return $gettext('Wrong type');
    default:
      return $gettext('Unknown type');
  }
}

/** The link as written in the text (its label is not stored) */
function written(link: BrokenLink): string {
  return link.is_url
    ? `camptocamp.org/${link.target_type}/${link.target_id}`
    : `[[${link.target_type}/${link.target_id}|…]]`;
}

/** The link to the document of this id, as it should be written */
function corrected(link: BrokenLink): string {
  return `[[${letterToDocumentType[link.target_document_type!]}s/${link.target_id}|…]]`;
}

function load(offset: number): ApiData {
  return c2c.moderator.getBrokenLinks(offset, PAGE_SIZE).then((response) => {
    // a restore meanwhile shifts the pages: no link twice
    const known = new Set(links.value.map(key));
    links.value.push(...response.data.links.filter((link) => !known.has(key(link))));
    total.value = response.data.total;
  });
}

function reload() {
  links.value = [];
  total.value = 0;
  page.value = load(0);
}

function loadMore() {
  page.value = load(links.value.length);
}

function confirmRestore(link: BrokenLink) {
  toRestore.value = link;
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
