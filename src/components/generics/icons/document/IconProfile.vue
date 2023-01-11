<template>
  <fa-icon icon="user" :fixed-width="fixedWidth" />
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
