<template>
  <span v-if="!!condition" :title="$gettext('condition_rating') + ' : ' + $gettext(condition, 'condition_ratings')">
    <icon-condition :condition="condition" />
  </span>
</template>

<script setup lang="ts">
defineProps({
  condition: {
    type: String,
    default: null,
  },
});
</script>
