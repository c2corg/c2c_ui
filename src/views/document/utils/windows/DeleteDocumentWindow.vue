<template>
  <modal-confirmation ref="modalWindow" :promise="promise" @confirm="executeDelete">
    <template #title>
      <span v-translate>Delete this document</span>
    </template>

    <span v-translate>Are you sure you want to delete this document?</span>
    <template v-if="images?.data">
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
    <p v-else-if="documentType !== 'image'" class="mt-2" v-translate>
      The personal images of its author linked to this document only are deleted with it.
    </p>
    <p class="mt-2 has-text-grey" v-translate>A moderator can restore it during 29 days.</p>
  </modal-confirmation>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { ImagesOfDeletion } from '@/js/apis/c2c/schemas';
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const router = useRouter();
const { documentType } = useDocumentType(props);

const promise = ref<ApiData | null>(null);
const modalWindowRef = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');
// ApiData is reactive itself: kept as is, not unwrapped
const images = shallowRef<ApiData<ImagesOfDeletion> | null>(null);

// the types of the images left orphan, with their count
const orphaned = computed(() => Object.entries(images.value?.data?.orphaned ?? {}).filter(([, count]) => count > 0));
const orphanedTotal = computed(() => orphaned.value.reduce((sum, [, count]) => sum + count, 0));

function show() {
  modalWindowRef.value!.show();
  // asked each time: the links may have changed (an image deleting nothing along: not asked)
  if (documentType.value !== 'image') {
    images.value = c2c.moderator.getImagesOfDeletion(props.document.document_id!);
  }
}

// shown by ToolBox / DocumentVersionBanner through their template refs
defineExpose({ show });

function executeDelete() {
  promise.value = c2c.moderator.deleteDocument(props.document.document_id!).then(() => {
    router.push({ name: documentType.value + 's' });
  });
}
</script>
