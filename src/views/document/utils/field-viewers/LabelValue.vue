<template>
  <div class="label-value">
    <span class="label-value-label has-text-weight-bold"
      ><!--
        -->{{ $filters.uppercaseFirstLetter(label) }}<!--
    --></span>
    <span>
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
});
</script>

<style scoped lang="scss">
.label-value-label {
  @include colon;
}
</style>
