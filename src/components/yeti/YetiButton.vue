<template>
  <router-link v-if="showButton" :to="href" class="button">
    <icon-yeti class="icon" />
    <span v-if="document">Voir dans YETI</span>
    <span v-else>YETI</span>
  </router-link>
</template>

<script>
  export default {
    props: {
      document: {
        type: Object,
        default: null
      }
    },
    computed: {
      documentType() {
        return this.$route.name;
      },
      href() {
        return '/yeti' + (this.document ? '/' + this.document.document_id : '');
      },
      isRouteDocumentType() {
        return this.documentType === 'route' || this.documentType === 'routes';
      },
      isActivitiesDocument() {
        const activities = ['skitouring', 'snow_ice_mixed', 'ice_climbing', 'snowshoeing'];
        return this.document.activities.some(activity => activities.includes(activity));
      },
      showButton() {
        return this.isRouteDocumentType && (this.document ? this.isActivitiesDocument : true);
      }
    }
  };
</script>
