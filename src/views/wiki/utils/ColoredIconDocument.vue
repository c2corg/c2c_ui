<template>
  <span class="icon icon-document-container" :style="`background: ${$options.colors[documentType] || 'black'}`">
    <icon-document :document-type="documentType" class="has-text-light" />
  </span>
</template>

<script>
import { documentTypeProperty } from '@/js/properties';

export default {
  props: { ...documentTypeProperty },

  colors: {
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
  },
};
</script>

<style scoped lang="scss">
.icon-document-container {
  border-radius: 100%;
}
</style>
