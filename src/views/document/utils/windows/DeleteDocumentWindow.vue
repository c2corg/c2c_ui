<template>
  <modal-confirmation
    ref="modalWindow"
    :promise="promise"
    :confirm-disabled="!!refusal || checking"
    @confirm="executeDelete"
  >
    <template #title>
      <span v-translate>Delete this document</span>
    </template>

    <!-- not the former sentence: its translations added that the linked photos are never deleted -->
    <p v-translate>Do you want to delete this document?</p>
    <p class="mt-2" v-translate>
      To change its title or the documents linked to it, edit it instead. To keep the photos of a duplicate, ask a
      moderator to merge it into the other document.
    </p>
    <!-- the API would refuse (the links changed since the page was read...): why, and no Delete button -->
    <div v-if="refusal" class="notification is-warning mt-2">{{ refusal }}</div>
    <template v-if="images?.data">
      <div v-if="breaking.length" class="notification is-warning is-light mt-2">
        <p class="has-text-weight-semibold" v-translate>The texts of these documents show it or link to it:</p>
        <p v-for="text of breaking" :key="text.document_id" class="is-clipped">
          <icon-document :document-type="letterToDocumentType[text.document_type]" fixed-width />
          <router-link :to="{ name: letterToDocumentType[text.document_type], params: { id: text.document_id } }">
            {{ text.title || '#' + text.document_id }}
          </router-link>
          <span v-for="lang of text.langs" :key="lang" class="tag is-white ml-1">{{ lang }}</span>
        </p>
      </div>
      <p v-if="images.data.deleted" class="mt-2">
        {{ $gettext('Personal images of its author also deleted:') }} <strong>{{ images.data.deleted }}</strong>
      </p>
      <p v-if="orphaned.length" class="mt-2">
        {{ $gettext('Images kept, linked to no document any more:') }}
        <strong>{{ orphanedTotal }}</strong>
        ({{ orphaned.map(([type, count]) => `${count} ${$gettext(type, 'image_types')}`).join(', ') }})
      </p>
    </template>
    <!-- not known (yet): the rule -->
    <p v-else-if="documentType !== 'image' && !refusal" class="mt-2" v-translate>
      The personal images of its author linked to this document only are deleted with it.
    </p>
    <!-- for the moderators only: the users cannot restore it themselves, it would only confuse them -->
    <p v-if="$user.isModerator" class="mt-2 has-text-grey" v-translate>A moderator can restore it during 29 days.</p>
  </modal-confirmation>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { apiErrors } from '@/js/apis/c2c/api-errors';
import type { EmbeddingDocument, ImagesOfDeletion } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const { $gettext } = useGlobalProperties();
const { letterToDocumentType } = constants;

const router = useRouter();
const { documentType } = useDocumentType(props);

const promise = ref<ApiData | null>(null);
const modalWindowRef = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');
// ApiData is reactive itself: kept as is, not unwrapped
const images = shallowRef<ApiData<ImagesOfDeletion> | null>(null);

// the types of the images left orphan, with their count
const orphaned = computed(() => Object.entries(images.value?.data?.orphaned ?? {}).filter(([, count]) => count > 0));
const orphanedTotal = computed(() => orphaned.value.reduce((sum, [, count]) => sum + count, 0));

// the texts that break: showing the image, or linking to the document (once each, with all their langs)
const breaking = computed(() => {
  const texts = new Map<number, EmbeddingDocument>();
  for (const text of [...(images.value?.data?.embedded_in ?? []), ...(images.value?.data?.linked_from ?? [])]) {
    const known = texts.get(text.document_id);
    texts.set(
      text.document_id,
      known ? { ...known, langs: [...new Set([...known.langs, ...text.langs])].sort() } : text
    );
  }
  return [...texts.values()];
});

// the API is asked whether it would refuse: no deletion meanwhile
const checking = computed(() => !!images.value?.loading);

// the API refuses this deletion: its reason (a refused 4xx; not a network error)
const refusal = computed(() => {
  const error = images.value?.error as { response?: { status?: number } } | undefined;
  const status = error?.response?.status;
  if (!status || status < 400 || status >= 500 || status === 404) {
    return null;
  }
  return $gettext(apiErrors(error)[0]!.description, 'API message');
});

function show() {
  modalWindowRef.value!.show();
  // asked each time: the links may have changed. For an image too: the texts showing it, and whether the API
  // would refuse
  images.value = c2c.moderator.getImagesOfDeletion(props.document.document_id!);
}

// shown by ToolBox / DocumentVersionBanner through their template refs
defineExpose({ show });

function executeDelete() {
  if (refusal.value || checking.value) {
    return;
  }
  promise.value = c2c.moderator.deleteDocument(props.document.document_id!).then(() => {
    router.push({ name: documentType.value + 's' });
  });
}
</script>
