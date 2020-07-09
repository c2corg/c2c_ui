<template>
  <div class="yeti-subpanel">
    <div class="columns is-mobile" v-if="hasDefaultSlot">
      <div class="column">
        <h2 class="title is-3 yeti-title">
          <slot name="default"></slot>
        </h2>
      </div>
    </div>

    <slot name="content"></slot>
  </div>
</template>

<script>
export default {
  computed: {
    hasDefaultSlot() {
      return !!this.$slots.default;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.yeti-subpanel + .yeti-subpanel {
  margin-top: 2rem;
}

.yeti-title {
  display: inline-block;
  margin-left: -1.25rem;
  padding: 0.25em 1.25rem;
  background: $grey-lighter;
}
</style>
