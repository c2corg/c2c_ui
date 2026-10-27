<template>
  <div ref="root" :class="{ 'is-active': isActive }" class="dropdown">
    <div class="dropdown-trigger" @click="isActive = !isActive && !disabled">
      <span aria-haspopup="true" :aria-controls="'dropdown-menu-' + id">
        <slot name="button" />
      </span>
    </div>

    <div :id="'dropdown-menu-' + id" class="dropdown-menu" role="menu">
      <div class="dropdown-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef } from 'vue';

defineProps({
  disabled: {
    type: Boolean,
    default: null,
  },
});

const isActive = ref(false);
const id = Math.random().toString().substring(2, 6);
const rootElement = useTemplateRef<HTMLElement>('root');

function onClick(event: MouseEvent) {
  // close dropdown when clicked outside
  if (!rootElement.value?.contains(event.target as Node)) {
    isActive.value = false;
  }
}

window.addEventListener('click', onClick);

onBeforeUnmount(() => {
  window.removeEventListener('click', onClick);
});

// the menus close themselves when one of their items is clicked: $refs.menu.isActive = false
defineExpose({ isActive });
</script>
<style scoped lang="scss">
.dropdown-menu {
  @media screen and (max-width: $tablet) {
    max-width: 100%;
  }
}
</style>
