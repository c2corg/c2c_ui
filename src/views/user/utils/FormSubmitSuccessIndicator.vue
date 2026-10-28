<template>
  <transition name="success-indicator">
    <fa-icon v-if="isVisible" icon="check" class="success-indicator" />
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

let timeout: ReturnType<typeof setTimeout> | undefined;

const props = defineProps({
  duration: {
    type: Number,
    default: 3000,
  },
});

const isVisible = ref(false);

function show() {
  isVisible.value = true;
  clearTimeout(timeout);
  timeout = setTimeout(() => (isVisible.value = false), props.duration);
}

function clear() {
  isVisible.value = false;
  clearTimeout(timeout);
}

// called by AccountView through its template ref
defineExpose({ show, clear });
</script>

<style lang="scss" scoped>
.success-indicator {
  font-size: 2em;
  color: $green;
}

.success-indicator-enter-active,
.success-indicator-leave-active {
  transition: opacity 0.5s;
}
.success-indicator-enter-active {
  animation: bounce-in 0.5s;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.success-indicator-enter-from,
.success-indicator-leave-to {
  opacity: 0;
}
</style>
