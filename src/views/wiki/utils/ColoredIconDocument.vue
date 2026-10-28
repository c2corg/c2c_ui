<template>
  <span class="icon icon-document-container" :style="`background: ${colors[documentType] || 'black'}`">
    <icon-document :document-type="documentType" class="has-text-light" />
  </span>
</template>

<script setup lang="ts">
import { documentTypeProperty } from '@/js/properties';

defineProps({ ...documentTypeProperty });

const colors: Record<string, string> = {
  area: 'purple',
  book: 'plum',
  article: 'darkcyan',
  image: 'pink',
  map: 'yellow',
  outing: 'grey',
  profile: 'red',
  route: 'dodgerblue',
  waypoint: 'green',
  xreport: 'tomato',
};
</script>

<style scoped lang="scss">
.icon-document-container {
  border-radius: 100%;
}
</style>
