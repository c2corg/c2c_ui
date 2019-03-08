<template>
  <span :title="$gettext('condition_rating') + ' : ' + $gettext(condition, 'condition_ratings')">
    <icon-condition :condition="condition" />
  </span>
</template>

<script lang="ts">
  export default {
    props: {
      condition: {
        type: String,
        default: null
      }
    }
  };
</script>
