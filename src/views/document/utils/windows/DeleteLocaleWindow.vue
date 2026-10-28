<template>
  <modal-confirmation ref="modalWindow" show-uncancelable-warning :promise="promise" @confirm="executeDelete">
    <template #title>
      <span v-translate>Delete this locale</span>
    </template>

    <span v-translate>Are you sure you want to delete this locale?</span>
  </modal-confirmation>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  localeLang: {
    type: String,
    required: true,
  },
});

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
  promise.value = c2c.moderator.deleteLocale(props.document.document_id!, props.localeLang).then(() => {
    router.push({ name: documentType.value, params: { id: props.document.document_id } });
  });
}
</script>
