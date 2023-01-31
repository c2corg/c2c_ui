<template>
  <fa-icon icon="flag-checkered" :fixed-width="fixedWidth" />
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
