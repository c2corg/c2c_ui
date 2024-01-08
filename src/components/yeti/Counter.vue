<template>
  <span class="yeti-counter" :class="{ 'has-background-primary': isPrimary }">
    <span><slot /></span>
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
  min-width: 1em;
  height: 1em;
  line-height: 1em;
  margin-left: 0.25rem;
  padding: 0 0.25rem;
  background: $grey-lighter;
  color: $grey-darker;
  border-radius: 1em;
  font-weight: normal;
  text-align: center;

  span {
    font-size: 0.72em;
    vertical-align: 0.125em;
  }

  &.has-background-primary {
    color: $white;
  }
}
</style>
