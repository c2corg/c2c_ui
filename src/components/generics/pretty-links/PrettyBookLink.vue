<template>

  <document-link :document="book" class="pretty-book-link has-hover-background">
    <icon-book class="has-text-dark"/>
    <document-title :document="book"/>,
    <em class="has-text-dark">{{ book.author }}</em>
  </document-link>

</template>

<script>
  export default {
    props: {
      book: {
        type: Object,
        required: true
      }
    }
  };
</script>

<style scoped lang="scss">

    .pretty-book-link{
        display:block
    }

</style>
