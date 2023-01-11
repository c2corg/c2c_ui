<template>
  <fa-icon icon="newspaper" :fixed-width="fixedWidth" />
</template>

<script>
export default {
  props: {
    fixedWidth: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
