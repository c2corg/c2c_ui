<template>
  <button class="button is-primary" :class="{ 'is-loading': isLoading }" @click="downloadOutings" v-translate>
    Download outings
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import utils from '@/js/utils';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({
  profileId: {
    type: Number,
    required: true,
  },
});

const router = useRouter();
const { $documentUtils } = useGlobalProperties();

const isLoading = ref(false);

function downloadOutings() {
  isLoading.value = true;

  const extraKeys = new Map([
    ['title', $documentUtils.getDocumentTitle],
    [
      'url',
      (object: C2cDocument) => {
        const href = router.resolve({ name: 'outing', params: { id: object.document_id } }).href;
        return `https://www.camptocamp.org${href}`;
      },
    ],
  ]);

  (c2c.outing as DocumentService)
    .fullDownload({ u: props.profileId }, 1000)
    .then((outings) => {
      utils.downloadCsv(outings as C2cDocument[], 'outings.csv', extraKeys);
      isLoading.value = false;
    })
    .catch((error: { response?: { data?: { errors?: { description: string }[] } } }) => {
      isLoading.value = false;
      window.alert(error.response?.data?.errors?.[0]?.description);
    });
}
</script>
