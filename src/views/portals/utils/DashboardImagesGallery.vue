<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="images">
        <icon-image />
        {{ $filters.uppercaseFirstLetter($gettext('images')) }}
      </router-link>
    </h4>
    <div class="images-container">
      <loading-notification :promise="imagesPromise" />
      <gallery v-if="images" :images="images" />
    </div>
    <hr />
    <h6 class="title is-6 has-text-centered">
      <router-link to="images">
        <span v-translate>See more</span>
      </router-link>
    </h6>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import Gallery from '@/components/gallery/Gallery.vue';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

// the images come from the API: they have their ids
type GalleryImages = InstanceType<typeof Gallery>['$props']['images'];

const imagesPromise = ref(
  (c2c.image as DocumentService).getAll({
    limit: 10,
  })
);

const images = computed(() => imagesPromise.value.data?.documents as GalleryImages | undefined);
</script>

<style scoped lang="scss">
.images-container {
  min-height: 200px;
}

h4 > a,
h6 > a {
  color: $color-text !important;
}

h4 > a:hover,
h6 > a:hover {
  color: $color-link !important;
}
</style>
