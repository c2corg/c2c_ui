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

<script setup lang="ts">
import c2c from '@/js/apis/c2c';
import { documentTypeProperty } from '@/js/properties';

// We always display this link, even when user is not logged: in this case, edition views redirect the user to /auth.
// No comment at the root of the template: Vue 3 would make it a fragment (in dev), which can't inherit @click.
defineProps({
  ...documentTypeProperty,
  query: {
    type: Object,
    default: null,
  },
});

const getApiLang = (lang: string | null) => c2c.getApiLang(lang ?? undefined);
</script>
