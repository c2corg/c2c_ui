<template>
  <div class="label-value">
    <span class="label-value-label has-text-weight-bold"
      ><!--
        -->{{ label | uppercaseFirstLetter
      }}<!--
    --></span>
    <span>
      <slot />
    </span>
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.label-value-label {
  @include colon;
}
</style>
