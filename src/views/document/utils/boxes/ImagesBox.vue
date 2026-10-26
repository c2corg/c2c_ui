<template>
  <div v-if="document.associations.images && document.associations.images.length !== 0" class="box no-print image-box">
    <gallery :images="document.associations.images" ref="gallery" />
  </div>
</template>

<script>
import Gallery from '@/components/gallery/Gallery';
import { documentProperty } from '@/js/properties';

export default {
  components: { Gallery },
  props: { ...documentProperty },
};
</script>
