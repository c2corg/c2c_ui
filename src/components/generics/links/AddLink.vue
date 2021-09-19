<template>
  <!-- We alawys display this link, even when user is not logged
    In this case, editions vues will redirect user to /auth -->
  <router-link
    :to="{ name: documentType + '-add', params: { lang: getApiLang($language.current) }, query: query }"
    rel="nofollow"
  >
    <slot>
      {{ $documentUtils.getCreationTitle(documentType) | uppercaseFirstLetter }}
    </slot>
  </router-link>
</template>

<script>
import c2c from '@/js/apis/c2c';
import { requireDocumentTypeProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentTypeProperty],

  props: {
    query: {
      type: Object,
      default: null,
    },
  },
  methods: {
    getApiLang(lang) {
      return c2c.getApiLang(lang);
    },
  },
};
</script>
