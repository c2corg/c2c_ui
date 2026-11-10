<template>
  <div class="box" @click="click">
    <slot />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['click']);

function click() {
  emit('click');
}
</script>
