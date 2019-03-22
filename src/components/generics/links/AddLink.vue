<template>
  <!-- We alawys display this link, even when user is not logged
    In this case, editions vues will redirect user to /auth -->
  <router-link :to="{name:documentType + '-add', params:{lang:$language.current}, query:query}">
    <template v-if="isShortLinkOnMobile">
      <span class="is-hidden-mobile">{{ $documentUtils.getCreationTitle('outing') | uppercaseFirstLetter }}</span>
      <fa-icon icon="plus" class="is-hidden-tablet" />
    </template>
    <template v-else>
      {{ $documentUtils.getCreationTitle(documentType) | uppercaseFirstLetter }}
    </template>
  </router-link>
</template>

<script>
  import { requireDocumentTypeProperty } from '@/js/properties-mixins';

  export default{
    mixins: [ requireDocumentTypeProperty ],

    props: {
      query: {
        type: Object,
        default: null
      },
      isShortLinkOnMobile: {
        type: Boolean,
        default: false
      }
    }
  };
</script>
