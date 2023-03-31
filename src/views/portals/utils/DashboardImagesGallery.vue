<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="images">
        <icon-image />
        {{ $gettext('images') | uppercaseFirstLetter }}
      </router-link>
    </h4>
    <div class="images-container">
      <loading-notification :promise="imagesPromise" />
      <gallery v-if="images" :images="images.documents" />
    </div>
    <hr />
    <h6 class="title is-6 has-text-centered">
      <router-link to="images">
        <span v-translate>See more</span>
      </router-link>
    </h6>
  </div>
</template>

<script>
import Gallery from '@/components/gallery/Gallery';
import c2c from '@/js/apis/c2c';

export default {
  name: 'DashboardImagesGallery',

  components: {
    Gallery,
  },

  data() {
    return {
      imagesPromise: null,
    };
  },

  computed: {
    images() {
      return this.imagesPromise?.data;
    },
  },

  created() {
    this.imagesPromise = c2c.image.getAll({ limit: 10 });
  },
};
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
