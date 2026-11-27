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

<style scoped>
/* a colon after the label, with a non-breaking space before it in French */
.label-value-label {
  :lang(fr) &::after {
    content: '\00a0:';
  }
  :lang(ca) &::after,
  :lang(de) &::after,
  :lang(en) &::after,
  :lang(es) &::after,
  :lang(eu) &::after,
  :lang(hu) &::after,
  :lang(it) &::after,
  :lang(sl) &::after,
  :lang(zh) &::after {
    content: ':';
  }
}
</style>
