<template>
  <span v-if="elevation" :title="$gettext('elevation_max')" class="is-nowrap">
    <fa-icon icon="sort-amount-up" class="card-icon" />
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
