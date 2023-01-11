<template>
  <fa-icon icon="atlas" :fixed-width="fixedWidth" />
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
