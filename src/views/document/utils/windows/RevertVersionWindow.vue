<template>
  <modal-confirmation ref="modalWindow" :promise="promise" @confirm="restoreVersion">
    <template #title>
      <span>
        <span v-translate>Restore this version</span>
      </span>
    </template>
    <span v-translate>Are you sure you want to revert to this version of the document?</span>
  </modal-confirmation>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  lang: {
    type: String,
    required: true,
  },
});

const route = useRoute();
const router = useRouter();
const { documentType } = useDocumentType(props);

const promise = ref<ApiData | null>(null);
const modalWindowRef = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');

function show() {
  modalWindowRef.value!.show();
}

// shown by ToolBox / DocumentVersionBanner through their template refs
defineExpose({ show });

function restoreVersion() {
  promise.value = c2c.moderator
    .revertDocument(props.document.document_id!, props.lang, route.params.version as string)
    .then(() => {
      modalWindowRef.value!.hide();
      router.push({ name: documentType.value, params: { id: props.document.document_id } });
    });
}
</script>
