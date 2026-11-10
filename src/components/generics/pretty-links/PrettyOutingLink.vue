<template>
  <document-link :document="outing" class="pretty-outing-link has-hover-background">
    <pretty-outing :outing="outing" />
  </document-link>
</template>

<script setup lang="ts">
defineProps({
  outing: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.pretty-outing-link {
  display: block;
  line-height: 1.4rem;
}
</style>
