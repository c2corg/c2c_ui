<template>
  <span :title="$gettext(documentType)">
    <icon-document :document-type="documentType" />
  </span>
</template>

<script>
import { documentTypeProperty } from '@/js/properties';

export default {
  props: { ...documentTypeProperty },
};
</script>
