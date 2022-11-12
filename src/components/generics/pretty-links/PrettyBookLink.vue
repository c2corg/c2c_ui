<template>
  <document-link :document="book" class="pretty-book-link has-hover-background">
    <pretty-book :book="book" />
  </document-link>
</template>

<script>
export default {
  props: {
    book: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.pretty-book-link {
  display: block;
}
</style>
