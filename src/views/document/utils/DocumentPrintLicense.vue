<template>
  <div class="print-only is-flex is-justify-content-space-between">
    <div class="m-2 has-text-grey is-italic">
      <p>{{ license }}</p>
      <p v-translate v-if="documentType !== 'image'">
        Images are under license specified in the original document of each image
      </p>
      <!-- Until we can reference the document version -->
      <p class="mt-2"><span v-translate>Printed on</span> {{ $dateUtils.toLocalizedString(new Date(), 'LLL') }}</p>
    </div>
    <img class="logo" src="@/assets/img/logo.svg" alt="Camptocamp.org" />
    <div v-html="qrcode" class="qrcode" />
  </div>
</template>

<script setup lang="ts">
import { renderSVG } from 'uqr';
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
});

const { $documentUtils, $gettext } = useGlobalProperties();

const documentType = computed(() => $documentUtils.getDocumentType(props.document.type));

const qrcode = computed(() => {
  const shortURL = location.href.substring(0, location.href.lastIndexOf('/'));
  return renderSVG(shortURL);
});

const license = computed(() => {
  // translations already defined in LicenseBox.vue
  let license;
  switch ($documentUtils.getDocumentLicense(props.document)) {
    case 'by-sa':
      license = 'This content is licensed under Creative Commons BY-SA 3.0';
      break;
    case 'by-nc-nd':
      license = 'This content is licensed under Creative Commons BY-NC-ND 3.0';
      break;
    case 'copyright':
    default:
      license = 'This book cover is the property of its editor and/or author';
  }
  return $gettext(license);
});
</script>

<style scoped lang="scss">
.logo {
  height: 70px;
}

.qrcode {
  width: 70px;
}
</style>
