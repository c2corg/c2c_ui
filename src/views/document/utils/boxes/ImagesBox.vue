<template>
  <div v-if="document.associations.images && document.associations.images.length !== 0" class="box no-print">
    <gallery :images="document.associations.images" ref="gallery" />
  </div>
</template>

<script>
import Gallery from '@/components/gallery/Gallery';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: { Gallery },
  mixins: [requireDocumentProperty],
};
</script>
