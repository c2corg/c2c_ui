<template>
  <transition name="success-indicator">
    <fa-icon v-if="isVisible" icon="check" class="success-indicator" />
  </transition>
</template>

<script>
let timeout;

export default {
  name: 'FormSubmitSuccessIndicator',
  props: {
    duration: {
      type: Number,
      default: 3000,
    },
  },
  data() {
    return {
      isVisible: false,
    };
  },

  methods: {
    show() {
      this.isVisible = true;
      clearTimeout(timeout);
      timeout = setTimeout(() => (this.isVisible = false), this.duration);
    },

    clear() {
      this.isVisible = false;
      clearTimeout(timeout);
    },
  },
};
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

.success-indicator-enter,
.success-indicator-leave-to {
  opacity: 0;
}
</style>
