<template>
  <fa-layers class="fa-lg" @click="click" :class="[direction, { disabled: disabled }]">
    <fa-icon icon="circle" />
    <fa-icon :icon="direction == 'right' ? 'redo-alt' : 'undo-alt'" transform="shrink-6" :style="{ color: 'white' }" />
  </fa-layers>
</template>

<script setup lang="ts">
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  direction: {
    type: String,
    default: 'right',
  },
});
const emit = defineEmits(['click']);

function click() {
  if (props.disabled) {
    return;
  }
  emit('click');
}
</script>

<style scoped lang="scss">
@import 'bulma/sass/utilities/initial-variables.sass';

div {
  cursor: pointer;
  color: $primary;

  &.disabled {
    cursor: not-allowed;
    color: $primary-light;
  }
}
</style>
