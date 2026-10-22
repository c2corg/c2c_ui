<template>
  <router-link
    :to="{ name: documentType + '-add', params: { lang: getApiLang($language.current) }, query: query }"
    rel="nofollow"
  >
    <slot>
      {{ $filters.uppercaseFirstLetter($documentUtils.getCreationTitle(documentType)) }}
    </slot>
  </router-link>
</template>

<script>
import c2c from '@/js/apis/c2c';
import { requireDocumentTypeProperty } from '@/js/properties-mixins';

// We always display this link, even when user is not logged: in this case, edition views redirect the user to /auth.
// No comment at the root of the template: Vue 3 would make it a fragment (in dev), which can't inherit @click.
export default {
  // Vue 3 listeners: @click from the parent goes to the link (Vue 2, and @vue/compat, needed @click.native)
  compatConfig: { INSTANCE_LISTENERS: false },

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
