<template>
  <fa-layers class="fa-lg" @click="visible ? $emit('click') : undefined" :class="{ 'hidden-button': !visible }">
    <fa-icon icon="circle" />
    <fa-icon :icon="['far', 'trash-alt']" transform="shrink-6" :style="{ color: 'white' }" />
  </fa-layers>
</template>

<script setup lang="ts">
defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
});
defineEmits(['click']);
</script>

<style scoped>
div {
  cursor: pointer;
  color: var(--c2c-red);
  transition: 300ms;

  svg {
    transition: 300ms;
  }
}

.hidden-button {
  width: 0;
  height: 0;
  svg {
    font-size: 0;
  }
}
</style>
