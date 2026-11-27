<template>
  <span :title="$gettext(documentType)">
    <icon-document :document-type="documentType" />
  </span>
</template>

<script setup lang="ts">
import { documentTypeProperty } from '@/js/properties';

defineProps({ ...documentTypeProperty });
</script>
