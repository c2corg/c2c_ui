<template>
  <span class="icon icon-document-container" :style="`background: ${$options.colors[documentType] || 'black'}`">
    <icon-document :document-type="documentType" class="has-text-light" />
  </span>
</template>

<script>
  import { requireDocumentTypeProperty } from '@/js/properties-mixins';

  export default {
    mixins: [ requireDocumentTypeProperty ],

    colors: {
      'area': 'purple',
      'book': 'plum',
      'article': 'darkcyan',
      'image': 'pink',
      'map': 'yellow',
      'outing': 'grey',
      'profile': 'red',
      'route': 'dodgerblue',
      'waypoint': 'green',
      'xreport': 'tomato'
    }
  };
</script>

<style scoped lang="scss">

  .icon-document-container{
    border-radius: 100%;
  }

</style>
