<template>
  <span class="yeti-counter" :class="{ 'has-background-primary': isPrimary }">
    <slot />
  </span>
</template>

<script>
export default {
  props: {
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.yeti-counter {
  display: inline-block;
  width: 1.1rem;
  height: 1.1rem;
  vertical-align: 0.1rem;
  margin-left: 0.25rem;
  background: $grey-lighter;
  color: $grey-darker;
  border-radius: 50%;
  font-size: 0.72em;
  font-weight: normal;
  text-align: center;

  &.has-background-primary {
    color: $white;
  }
}
</style>
