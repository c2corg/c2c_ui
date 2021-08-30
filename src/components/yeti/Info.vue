<template>
  <div class="info-text mt-3 mb-3 px-3" :class="'is-' + type">
    <fa-icon :icon="icon" class="info-icon mt-1 ml-1" />
    <div class="info-content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: 'info',
    },
  },
  data() {
    return {
      icons: {
        info: 'info-circle',
        warning: 'exclamation-circle',
        help: 'question-circle',
      },
    };
  },
  computed: {
    icon() {
      return this.icons[this.type];
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.info-text {
  font-size: 0.85em;
}
.is-info {
  color: $primary;
}
.is-warning {
  color: $red;
}
.is-help {
  background: $grey-lightest;
  color: $grey-dark;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1.5rem !important;
}
.info-icon {
  float: left;
}
.info-content {
  margin-left: 2rem;
}
</style>
