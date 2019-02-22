<template>
  <span>
    <span v-if="uppercaseFirstLetter">{{ title | uppercaseFirstLetter }}</span>
    <span v-else>{{ title }}</span>
  </span>
</template>

<script>
  import { requireDocumentProperty } from '@/js/properties-mixins';

  export default {
    mixins: [ requireDocumentProperty ],

    props: {
      uppercaseFirstLetter: {
        type: Boolean,
        default: false
      }
    },

    computed: {
      title() {
        return this.$documentUtils.getDocumentTitle(this.document, this.$route.params.lang);
      }
    }
  };
</script>
