<template>
  <document-link :document="outing" class="pretty-outing-link has-hover-background" target="_blank">
    <span class="has-text-normal">
      {{ outing.date_end }}&hairsp;&bull;&hairsp;{{ outing.author.name }} -
    </span>
    <document-title :document="outing" />
  </document-link>
</template>

<script>
  export default {
    props: {
      outing: {
        type: Object,
        required: true
      }
    }
  };
</script>

<style scoped lang="scss">

    .pretty-outing-link{
        display:block
    }

</style>
