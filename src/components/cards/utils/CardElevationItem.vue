<template>
  <span v-if="elevation" :title="$gettext('elevation_max')">
    <fa-icon icon="sort-amount-up" class="has-text-primary"/>
    {{ elevation }}&nbsp;m
  </span>
</template>

<script>

  export default {
    props: {
      elevation: {
        type: Number,
        default: null
      }
    }
  };

</script>
