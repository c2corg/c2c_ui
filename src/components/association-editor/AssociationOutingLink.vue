<template>
  <document-link :document="outing" class="pretty-outing-link has-hover-background">
    <span class="has-text-normal">
      {{ outing.date_start }}
    </span>
    <span class="has-text-normal">
      &hairsp;&bull;&hairsp;
      {{ outing.author.name }}
      -
    </span>
    <document-title :document="outing" class="is-ellipsed"/>
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
