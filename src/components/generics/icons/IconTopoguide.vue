<template>
  <fa-icon icon="arrow-right" :fixed-width="fixedWidth" />
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
