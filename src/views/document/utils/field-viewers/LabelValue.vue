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

<style scoped>
:lang(fr) .label-value-label:after {
  content: '\00a0:';
}
:lang(it) .label-value-label:after,
:lang(de) .label-value-label:after,
:lang(en) .label-value-label:after,
:lang(es) .label-value-label:after,
:lang(ca) .label-value-label:after,
:lang(eu) .label-value-label:after,
:lang(zh) .label-value-label:after {
  content: ':';
}
</style>
