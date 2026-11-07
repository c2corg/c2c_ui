<template>
  <span class="gotop-button" @click="onClick" :title="$gettext('Back to the top')">
    <fa-icon icon="arrow-up" />
  </span>
</template>

<script setup lang="ts">
function onClick() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<style scoped>
.gotop-button {
  cursor: pointer;
}
</style>
