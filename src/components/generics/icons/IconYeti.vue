<template>
  <fa-icon
    class="icon-yeti"
    icon="exclamation"
    transform="shrink-6 rotate-45"
    mask="square"
    :fixed-width="fixedWidth"
  />
</template>

<script setup lang="ts">
defineProps({
  fixedWidth: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.icon-yeti {
  transform: rotate(-45deg) scale(0.95);
}
</style>
