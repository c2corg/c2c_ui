<template>
  <div :class="{ 'is-active': isActive }" class="dropdown">
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

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: null,
    },
  },

  data() {
    return {
      isActive: false,
      id: 0,
    };
  },

  created() {
    this.id = Math.random().toString().substring(2, 6);
    window.addEventListener('click', this.onClick);
  },

  beforeDestroy() {
    window.removeEventListener('click', this.onClick);
  },

  methods: {
    onClick(event) {
      // close dropdown when clicked outside
      if (!this.$el.contains(event.target)) {
        this.isActive = false;
      }
    },
  },
};
</script>
<style scoped lang="scss">
.dropdown-menu {
  @media screen and (max-width: $tablet) {
    max-width: 100%;
  }
}
</style>
