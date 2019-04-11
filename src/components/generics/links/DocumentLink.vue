<template>

  <router-link :to="{name:documentType, params:{id:document.document_id, lang:lang}}" :target="target">
    <slot>
      <document-title v-if="document.type!='u'" :document="document" :uppercase-first-letter="uppercaseFirstLetter" />
      <span v-else-if="uppercaseFirstLetter">{{ document.name | uppercaseFirstLetter }}</span>
      <span v-else>{{ document.name }}</span>
    </slot>
  </router-link>

</template>

<script>
  import { requireDocumentProperty } from '@/js/properties-mixins';

  export default {

    mixins: [requireDocumentProperty],

    props: {
      lang: {
        type: String,
        default: null
      },

      uppercaseFirstLetter: {
        type: Boolean,
        default: false
      },

      target: {
        type: String,
        default: undefined
      }
    }
  };

</script>
