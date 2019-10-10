<template>
  <div class="section" v-if="document">
    <h1 class="title is-1">
      <slot name="icon-document">
        <icon-document :document-type="documentType" />
      </slot>
      <span>&thinsp;</span>
      <document-title :document="document" uppercase-first-letter />
    </h1>
    <div class="cards-container is-flex">
      <document-link
        v-for="image in document.associations.images"
        :key="image.document_id"
        :document="image"
        :title="$documentUtils.getDocumentTitle(image)"
        class="card-image">
        <img :src="getMediumImageUrl(image)" height="250">
      </document-link>
    </div>
  </div>
</template>

<script>
  import c2c from '@/js/apis/c2c';
  import imageUrls from '@/js/image-urls';

  export default {

    data() {
      return {
        promise: null
      };
    },

    computed: {
      document() {
        if (!this.promise || !this.promise.data) {
          return null;
        }
        return this.promise.data;
      },
      /*
      * properties that are deducted from URL
      */
      documentId() {
        return parseInt(this.$route.params.id, 10);
      },
      documentType() {
        return this.$route.params.documentType;
      }
    },

    watch: {
      '$route': {
        handler: 'loadDocument',
        immediate: true
      }
    },

    methods: {
      loadDocument($route) {
        if (this.document && this.documentId === this.document.document_id) {
          return;
        }

        this.promise = c2c[this.documentType].get(this.documentId)
          .then(this.handleRedirection);
      },

      handleRedirection() {
        if (this.document.redirects_to) {
          this.$router.push({ params: { id: this.document.redirects_to, documentType: this.documentType } });
        }
      },

      getMediumImageUrl: imageUrls.getMedium
    }
  };
</script>

<style scoped lang="scss">

  .cards-container{
    flex-flow:wrap row;
    justify-content: space-between;

    .card-image{
      transition:0.2s;
      margin-bottom:5px;

      img{
        height:200px;
      }
    }
  }

</style>
