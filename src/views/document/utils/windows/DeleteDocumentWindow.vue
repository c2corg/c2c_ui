<template>
  <modal-confirmation ref="modalWindow" show-uncancelable-warning :promise="promise" @confirm="executeDelete">
    <template #title>
      <span v-translate>Delete this document</span>
    </template>

    <span v-translate>Are you sure you want to delete this document?</span>
  </modal-confirmation>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const router = useRouter();
const { documentType } = useDocumentType(props);

const promise = ref<ApiData | null>(null);
const modalWindowRef = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');

function show() {
  modalWindowRef.value!.show();
}

// shown by ToolBox / DocumentVersionBanner through their template refs
defineExpose({ show });

function executeDelete() {
  promise.value = c2c.moderator.deleteDocument(props.document.document_id!).then(() => {
    router.push({ name: documentType.value + 's' });
  });
}
</script>
