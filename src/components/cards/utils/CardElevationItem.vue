<template>
  <span v-if="elevation" :title="$gettext('elevation_max')" class="is-nowrap">
    <fa-icon icon="sort-amount-up" class="card-icon" />
    {{ elevation }}&nbsp;m
  </span>
</template>

<script setup lang="ts">
defineProps({
  elevation: {
    type: Number,
    default: null,
  },
});
</script>
