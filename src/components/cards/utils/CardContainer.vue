<template>
  <div class="card" :class="{ 'is-highlighted': highlighted }">
    <document-link :document="document" :target="target">
      <slot />
    </document-link>
  </div>
</template>

<script>
export default {
  props: {
    document: {
      type: Object,
      default: null,
    },
    target: {
      type: String,
      default: undefined,
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped lang="scss">
.card {
  transition: 0.1s;
  border: $card-border;
  background: white;
}

.card:hover,
.is-highlighted {
  transition: 0.2s;
  box-shadow: $card-hover-shadow;
  background: $hover-background;
}
</style>
